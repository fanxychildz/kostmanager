import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '~/lib/hooks'
import { api } from '~/lib/api'
import { BillPaymentForm } from '~/components/portal/bill-payment-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { formatRupiah, formatDate } from '~/lib/utils'

export const Route = createFileRoute('/portal/payments/$billId')({
  component: PortalPaymentPage,
})

function PortalPaymentPage() {
  const { billId } = Route.useParams()
  const { data: bills, loading } = useQuery({ queryFn: () => api.portal.bills() })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const bill = (bills ?? []).find((b: any) => b.id === billId)

  if (!bill) {
    return (
      <div className="space-y-4 max-w-xl mx-auto">
        <Link to="/portal/bills" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 gap-1.5 transition">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Tagihan
        </Link>
        <Card className="border border-slate-200 rounded-2xl shadow-xs">
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-bold text-slate-800">Tagihan Tidak Ditemukan</h3>
            <p className="text-sm text-slate-400 mt-1">Sistem tidak dapat menemukan tagihan yang diminta.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <Link to="/portal/bills" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 gap-1.5 transition">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Tagihan
        </Link>
        <h1 className="text-2xl font-bold mt-3">Pembayaran Mandiri</h1>
        <p className="text-muted-foreground text-sm">Unggah bukti pembayaran untuk diverifikasi pengelola.</p>
      </div>

      <Card className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 p-5">
          <CardTitle className="text-base font-bold text-slate-800">Ringkasan Tagihan</CardTitle>
          <CardDescription className="text-xs font-semibold">
            Periode Sewa {bill.periodMonth}/{bill.periodYear} • Jatuh Tempo {formatDate(bill.dueDate)}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Harga Sewa Kamar</span>
            <span className="font-semibold text-slate-800">{formatRupiah(bill.rentAmount)}</span>
          </div>
          {(bill.electricityAmount > 0 || bill.waterAmount > 0 || bill.wifiAmount > 0 || bill.otherAmount > 0) && (
            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs text-slate-500">
              {bill.electricityAmount > 0 && (
                <div className="flex justify-between">
                  <span>Listrik</span>
                  <span>{formatRupiah(bill.electricityAmount)}</span>
                </div>
              )}
              {bill.waterAmount > 0 && (
                <div className="flex justify-between">
                  <span>Air</span>
                  <span>{formatRupiah(bill.waterAmount)}</span>
                </div>
              )}
              {bill.wifiAmount > 0 && (
                <div className="flex justify-between">
                  <span>WiFi</span>
                  <span>{formatRupiah(bill.wifiAmount)}</span>
                </div>
              )}
              {bill.otherAmount > 0 && (
                <div className="flex justify-between">
                  <span>Lainnya</span>
                  <span>{formatRupiah(bill.otherAmount)}</span>
                </div>
              )}
            </div>
          )}
          <div className="border-t border-slate-150 pt-3 flex items-center justify-between font-bold text-base text-slate-900">
            <span>Total Harus Dibayar</span>
            <span className="text-blue-600">{formatRupiah(bill.totalAmount)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6">
        <BillPaymentForm bill={bill} />
      </Card>
    </div>
  )
}
