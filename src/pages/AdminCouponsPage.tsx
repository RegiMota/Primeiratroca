import { useState, useEffect } from 'react';
import { couponsAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';

interface Coupon {
  id: number;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  maxUses?: number;
  currentUses: number;
  isActive: boolean;
  orderCount?: number;
}

export function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    minPurchase: '',
    maxDiscount: '',
    validFrom: '',
    validUntil: '',
    maxUses: '',
    isActive: true,
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const data = await couponsAPI.getAll();
      setCoupons(data);
    } catch (error) {
      console.error('Error loading coupons:', error);
      toast.error('Erro ao carregar cupons');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      minPurchase: coupon.minPurchase?.toString() || '',
      maxDiscount: coupon.maxDiscount?.toString() || '',
      validFrom: new Date(coupon.validFrom).toISOString().slice(0, 16),
      validUntil: new Date(coupon.validUntil).toISOString().slice(0, 16),
      maxUses: coupon.maxUses?.toString() || '',
      isActive: coupon.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este cupom?')) {
      return;
    }

    try {
      await couponsAPI.delete(id);
      toast.success('Cupom deletado com sucesso');
      loadCoupons();
    } catch (error: any) {
      console.error('Error deleting coupon:', error);
      toast.error(error.response?.data?.error || 'Erro ao deletar cupom');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const couponData = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : undefined,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
        validFrom: new Date(formData.validFrom).toISOString(),
        validUntil: new Date(formData.validUntil).toISOString(),
      };

      if (editingCoupon) {
        await couponsAPI.update(editingCoupon.id, couponData);
        toast.success('Cupom atualizado com sucesso');
      } else {
        await couponsAPI.create(couponData);
        toast.success('Cupom criado com sucesso');
      }

      setIsDialogOpen(false);
      resetForm();
      loadCoupons();
    } catch (error: any) {
      console.error('Error saving coupon:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar cupom');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: '',
      minPurchase: '',
      maxDiscount: '',
      validFrom: '',
      validUntil: '',
      maxUses: '',
      isActive: true,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}%${coupon.maxDiscount ? ` (max R$ ${coupon.maxDiscount.toFixed(2)})` : ''}`;
    }
    return `R$ ${coupon.discountValue.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sky-500" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            Gerenciar Cupons
          </h2>
          <p className="text-gray-600">Crie e gerencie cupons de desconto</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600"
              style={{ fontWeight: 700 }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Cupom
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? 'Editar Cupom' : 'Adicionar Novo Cupom'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="code">Código do Cupom *</Label>
                <Input
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                  className="mt-2"
                  placeholder="EXEMPLO10"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <div>
                <Label htmlFor="discountType">Tipo de Desconto *</Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(value) => setFormData({ ...formData, discountType: value as 'percentage' | 'fixed' })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentual (%)</SelectItem>
                    <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="discountValue">Valor do Desconto *</Label>
                <Input
                  id="discountValue"
                  name="discountValue"
                  type="number"
                  step="0.01"
                  min="0"
                  max={formData.discountType === 'percentage' ? '100' : undefined}
                  value={formData.discountValue}
                  onChange={handleInputChange}
                  required
                  className="mt-2"
                  placeholder={formData.discountType === 'percentage' ? '10' : '50.00'}
                />
                {formData.discountType === 'percentage' && (
                  <p className="mt-1 text-xs text-gray-500">Máximo: 100%</p>
                )}
              </div>

              <div>
                <Label htmlFor="minPurchase">Compra Mínima (R$)</Label>
                <Input
                  id="minPurchase"
                  name="minPurchase"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.minPurchase}
                  onChange={handleInputChange}
                  className="mt-2"
                  placeholder="Opcional"
                />
              </div>

              {formData.discountType === 'percentage' && (
                <div>
                  <Label htmlFor="maxDiscount">Desconto Máximo (R$)</Label>
                  <Input
                    id="maxDiscount"
                    name="maxDiscount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.maxDiscount}
                    onChange={handleInputChange}
                    className="mt-2"
                    placeholder="Opcional"
                  />
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="validFrom">Válido De *</Label>
                  <Input
                    id="validFrom"
                    name="validFrom"
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={handleInputChange}
                    required
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="validUntil">Válido Até *</Label>
                  <Input
                    id="validUntil"
                    name="validUntil"
                    type="datetime-local"
                    value={formData.validUntil}
                    onChange={handleInputChange}
                    required
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="maxUses">Usos Máximos</Label>
                <Input
                  id="maxUses"
                  name="maxUses"
                  type="number"
                  min="0"
                  value={formData.maxUses}
                  onChange={handleInputChange}
                  className="mt-2"
                  placeholder="Ilimitado (deixe vazio)"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4"
                />
                <Label htmlFor="isActive">Cupom Ativo</Label>
              </div>

              <Button
                type="submit"
                className="w-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600"
                style={{ fontWeight: 700 }}
                disabled={submitting}
              >
                {submitting ? 'Salvando...' : editingCoupon ? 'Atualizar Cupom' : 'Criar Cupom'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Coupons Table */}
      <div className="rounded-2xl bg-white shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left" style={{ fontWeight: 700 }}>
                  Código
                </th>
                <th className="px-6 py-4 text-left" style={{ fontWeight: 700 }}>
                  Desconto
                </th>
                <th className="px-6 py-4 text-left" style={{ fontWeight: 700 }}>
                  Validade
                </th>
                <th className="px-6 py-4 text-left" style={{ fontWeight: 700 }}>
                  Usos
                </th>
                <th className="px-6 py-4 text-left" style={{ fontWeight: 700 }}>
                  Status
                </th>
                <th className="px-6 py-4 text-right" style={{ fontWeight: 700 }}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-600">
                    Carregando cupons...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-600">
                    Nenhum cupom encontrado
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-sky-500" />
                        <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                          {coupon.code}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span style={{ fontWeight: 600 }}>{formatDiscount(coupon)}</span>
                      {coupon.minPurchase && (
                        <p className="text-xs text-gray-500">
                          Mín: R$ {coupon.minPurchase.toFixed(2)}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p>{formatDate(coupon.validFrom)}</p>
                        <p className="text-gray-500">até</p>
                        <p>{formatDate(coupon.validUntil)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={coupon.maxUses && coupon.currentUses >= coupon.maxUses ? 'text-red-600' : 'text-gray-700'}>
                        {coupon.currentUses} / {coupon.maxUses ?? '∞'}
                      </span>
                      {coupon.orderCount !== undefined && coupon.orderCount > 0 && (
                        <p className="text-xs text-gray-500">
                          {coupon.orderCount} pedido(s)
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={coupon.isActive ? 'default' : 'secondary'}>
                        {coupon.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(coupon)}
                          className="text-sky-500 hover:bg-sky-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(coupon.id)}
                          className="text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

