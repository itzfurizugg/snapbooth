import QRCode from 'qrcode'

export async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 1024,
    color: { dark: '#11100E', light: '#FFFFFF' },
  })
}