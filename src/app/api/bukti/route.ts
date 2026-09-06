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

    // Jika disimpan sebagai Base64 Data URL
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

    // Jika URL berupa Google Drive atau path lokal /uploads/
    return NextResponse.redirect(new URL(proofUrl, request.url));
  } catch (error: any) {
    console.error('Error serving proof file in /api/bukti:', error);
    return new NextResponse(`Gagal memuat bukti transfer: ${error.message}`, { status: 500 });
  }
}
