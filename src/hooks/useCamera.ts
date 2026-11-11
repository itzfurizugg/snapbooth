import { useCallback, useEffect, useRef, useState } from 'react'
import type { CameraErrorInfo } from '../types'

export type CameraStatus = 'idle' | 'requesting' | 'ready' | 'error'

interface UseCameraResult {
  videoRef: React.RefObject<HTMLVideoElement | null>
  status: CameraStatus
  error: CameraErrorInfo | null
  facing: 'user' | 'environment'
  start: () => Promise<void>
  stop: () => void
  flip: () => void
}

function mapCameraError(error: unknown): CameraErrorInfo {
  const name = error instanceof DOMException ? error.name : ''

  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return {
      code: 'permission',
      title: 'Izin kamera ditolak',
      message: 'Browser memblokir akses kamera. Snapbooth tidak bisa mengambil foto tanpa izin.',
      steps: [
        'Klik ikon kamera di address bar, lalu pilih “Izinkan”.',
        'Muat ulang halaman setelah izin diubah.',
        'Di iOS, buka Pengaturan → Safari → Kamera → Izinkan.',
      ],
    }
  }

  if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') {
    return {
      code: 'missing',
      title: 'Kamera tidak ditemukan',
      message: 'Perangkat ini tidak mendeteksi kamera yang bisa dipakai browser.',
      steps: [
        'Sambungkan kamera eksternal bila memakai komputer.',
        'Pastikan kamera tidak dinonaktifkan di pengaturan sistem.',
        'Coba browser lain yang mendukung getUserMedia.',
      ],
    }
  }

  if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') {
    return {
      code: 'busy',
      title: 'Kamera sedang dipakai',
      message: 'Aplikasi lain sedang menggunakan kamera, atau kamera belum bisa diakses.',
      steps: [
        'Tutup aplikasi video call atau kamera lain.',
        'Cabut dan sambungkan ulang kamera eksternal.',
        'Tekan “Coba lagi” setelah kamera bebas.',
      ],
    }
  }

  return {
    code: 'unknown',
    title: 'Kamera gagal dinyalakan',
    message: 'Terjadi masalah saat mengakses kamera perangkat.',
    steps: [
      'Muat ulang halaman dan coba lagi.',
      'Periksa izin kamera pada pengaturan browser.',
      'Gunakan Chrome, Safari, Firefox, atau Edge versi terbaru.',
    ],
  }
}

export function useCamera(): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const requestRef = useRef(0)
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [error, setError] = useState<CameraErrorInfo | null>(null)
  const [facing, setFacing] = useState<'user' | 'environment'>('user')

  const stop = useCallback(() => {
    requestRef.current += 1
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setStatus('idle')
  }, [])

  const start = useCallback(async () => {
    const request = requestRef.current + 1
    requestRef.current = request
    setStatus('requesting')
    setError(null)

    if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setError({
        code: 'insecure',
        title: 'Kamera butuh HTTPS',
        message: 'Browser hanya mengizinkan kamera pada koneksi aman.',
        steps: [
          'Buka Snapbooth melalui alamat https://.',
          'Untuk pengembangan lokal, localhost sudah dianggap aman.',
          'Hubungi penyelenggara bila tautan booth memakai http://.',
        ],
      })
      setStatus('error')
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError({
        code: 'unsupported',
        title: 'Browser belum mendukung kamera',
        message: 'API kamera tidak tersedia di browser ini.',
        steps: [
          'Gunakan Chrome, Safari, Firefox, atau Edge versi terbaru.',
          'Pastikan halaman tidak dibuka di mode privasi yang membatasi kamera.',
          'Coba perangkat lain bila masalah berlanjut.',
        ],
      })
      setStatus('error')
      return
    }

    try {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (requestRef.current !== request) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => undefined)
      }
      setStatus('ready')
    } catch (caught) {
      if (requestRef.current !== request) return
      setError(mapCameraError(caught))
      setStatus('error')
    }
  }, [facing])

  const flip = useCallback(() => {
    setFacing((current) => (current === 'user' ? 'environment' : 'user'))
  }, [])

  useEffect(() => {
    return () => {
      requestRef.current += 1
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  const facingRef = useRef(facing)
  useEffect(() => {
    if (facingRef.current !== facing) {
      facingRef.current = facing
      if (status === 'ready' || status === 'requesting') void start()
    }
  }, [facing, start, status])

  return { videoRef, status, error, facing, start, stop, flip }
}
