import { NextRequest, NextResponse } from 'next/server';
import { PpdbModel } from '@/models/ppdbModel';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || '';
    const field = searchParams.get('field') || 'bukti_bayar_url';

    if (!id) {
      return new NextResponse('Parameter id pendaftaran diperlukan.', { status: 400 });
    }

    const ppdbModel = new PpdbModel();
    let reg = await ppdbModel.findBy('id', id);
    if (!reg) {
      reg = await ppdbModel.findBy('no_pendaftaran', id);
    }

    if (!reg) {
      return new NextResponse('Data pendaftaran tidak ditemukan.', { status: 404 });
    }

    const proofUrl = (reg as any)[field] || reg.bukti_bayar_url;

    if (!proofUrl) {
      return new NextResponse('Berkas bukti transfer belum diunggah untuk pendaftaran ini.', { status: 404 });
    }

    // 1. Jika disimpan sebagai Base64 Data URL
    if (proofUrl.startsWith('data:')) {
      const commaIdx = proofUrl.indexOf(',');
      if (commaIdx !== -1) {
        const headerPart = proofUrl.substring(5, commaIdx);
        const mimeType = headerPart.split(';')[0] || 'image/png';
        const base64Data = proofUrl.substring(commaIdx + 1);
        const buffer = Buffer.from(base64Data, 'base64');
        const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
        const fileName = `bukti_transfer_${reg.no_pendaftaran || reg.id}.${ext}`;

        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': mimeType,
            'Content-Disposition': `inline; filename="${fileName}"`,
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
          },
        });
      }
    }

    // 2. Jika URL adalah Google Drive
    const driveMatch = proofUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || proofUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      const fileId = driveMatch[1];
      
      // Coba ambil stream gambar langsung dari Google Direct CDN (lh3.googleusercontent.com)
      try {
        const cdnUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
        const cdnRes = await fetch(cdnUrl, { redirect: 'follow' });
        
        if (cdnRes.ok) {
          const contentType = cdnRes.headers.get('content-type') || 'image/jpeg';
          if (!contentType.includes('text/html')) {
            const arrayBuf = await cdnRes.arrayBuffer();
            return new NextResponse(Buffer.from(arrayBuf), {
              status: 200,
              headers: {
                'Content-Type': contentType,
                'Content-Disposition': `inline; filename="bukti_${reg.no_pendaftaran || fileId}.${contentType.includes('pdf') ? 'pdf' : 'jpg'}"`,
                'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
              },
            });
          }
        }

        // Jika CDN mengembalikan HTML (misalnya PDF), coba via Google Drive Direct Export
        const exportUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        const exportRes = await fetch(exportUrl, { redirect: 'follow' });
        if (exportRes.ok) {
          const contentType = exportRes.headers.get('content-type') || 'image/jpeg';
          const arrayBuf = await exportRes.arrayBuffer();
          return new NextResponse(Buffer.from(arrayBuf), {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Content-Disposition': `inline; filename="bukti_${reg.no_pendaftaran || fileId}.${contentType.includes('pdf') ? 'pdf' : 'jpg'}"`,
              'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
            },
          });
        }
      } catch (streamErr) {
        console.warn('Gagal streaming Google Drive langsung, fallback ke redirect:', streamErr);
      }
    }

    // 3. Fallback jika URL berupa external URL atau path lokal
    return NextResponse.redirect(new URL(proofUrl, request.url));
  } catch (error: any) {
    console.error('Error serving proof file in /api/bukti:', error);
    return new NextResponse(`Gagal memuat bukti transfer: ${error.message}`, { status: 500 });
  }
}
