import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Loader2, Camera } from 'lucide-react'
import { toast } from 'sonner'
import { formatRupiah } from '~/lib/utils'

interface BillPaymentFormProps {
  bill: {
    id: string
    totalAmount: number
    periodMonth: number
    periodYear: number
  }
}

export function BillPaymentForm({ bill }: BillPaymentFormProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [method, setMethod] = useState('bank_transfer')
  const [amount, setAmount] = useState(bill.totalAmount.toString())
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [proofImage, setProofImage] = useState<string | null>(null)
  const [imageName, setImageName] = useState('')

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran berkas terlalu besar. Maksimal 5MB.')
      return
    }

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format berkas tidak didukung. Hanya JPEG, PNG, dan WEBP.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setProofImage(reader.result as string)
      setImageName(file.name)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!proofImage) {
      toast.error('Harap unggah bukti transfer pembayaran.')
      return
    }

    const paymentAmount = parseInt(amount, 10)
    if (isNaN(paymentAmount) || paymentAmount < bill.totalAmount) {
      toast.error(`Nominal pembayaran minimal adalah ${formatRupiah(bill.totalAmount)}`)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billId: bill.id,
          amount: paymentAmount,
          paymentMethod: method,
          paidAt,
          proofImage,
          notes: notes || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat mengirim pembayaran.')
      }

      toast.success('Pembayaran telah tercatat dan menunggu konfirmasi pengelola.')
      setTimeout(() => {
        navigate({ to: '/portal/bills' })
      }, 1500)
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengirim pembayaran.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="method">Metode Pembayaran</Label>
        <Select value={method} onValueChange={setMethod}>
          <SelectTrigger id="method">
            <SelectValue placeholder="Pilih metode pembayaran" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bank_transfer">Transfer Bank (BCA/Mandiri/BNI/BRI)</SelectItem>
            <SelectItem value="qris_manual">QRIS Manual</SelectItem>
            <SelectItem value="other">Lainnya</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">Nominal Bayar (Rp)</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            min={bill.totalAmount}
          />
          <p className="text-[10px] text-slate-400 font-semibold mt-1">
            * Minimal sesuai tagihan: {formatRupiah(bill.totalAmount)}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="paidAt">Tanggal Bayar</Label>
          <Input
            id="paidAt"
            type="date"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Bukti Transfer (Struk/Screenshot)</Label>
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 hover:bg-slate-50 transition-colors relative">
          <Input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            required={!proofImage}
          />
          {proofImage ? (
            <div className="space-y-3 text-center z-10 pointer-events-none">
              <img
                src={proofImage}
                alt="Pratinjau Bukti"
                className="max-h-40 object-contain mx-auto rounded-lg shadow-sm"
              />
              <p className="text-xs font-semibold text-slate-600 truncate max-w-xs">{imageName}</p>
              <span className="text-[10px] text-blue-600 font-bold block">Klik atau seret untuk mengganti berkas</span>
            </div>
          ) : (
            <div className="text-center z-10 pointer-events-none space-y-2">
              <div className="p-3 bg-slate-100 rounded-full w-fit mx-auto text-slate-500">
                <Camera className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-600">Klik untuk upload bukti transfer</p>
              <p className="text-xs text-slate-400 font-medium">JPEG, PNG, atau WEBP (Maks. 5MB)</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Catatan Pembayar (opsional)</Label>
        <Input
          id="notes"
          placeholder="Contoh: Transfer dari Rekening Mandiri a.n Budi"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Mengirim Pembayaran...
          </>
        ) : (
          'Kirim Bukti Pembayaran'
        )}
      </Button>
    </form>
  )
}
