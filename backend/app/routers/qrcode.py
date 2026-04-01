import io

from fastapi import APIRouter
from fastapi.responses import Response

router = APIRouter(prefix='/qrcode', tags=['qrcode'])


@router.get('')
def get_qrcode(path: str = '') -> Response:
    """Return a QR code PNG for the given mini program path."""
    try:
        import qrcode  # type: ignore[import]
        from qrcode.image.pil import PilImage  # type: ignore[import]
    except ImportError:
        return Response(content=b'', status_code=503, media_type='image/png')

    data = path.strip() or '/pages/mycards/mycards'
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(image_factory=PilImage)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)

    return Response(
        content=buf.read(),
        media_type='image/png',
        headers={'Cache-Control': 'public, max-age=3600'},
    )
