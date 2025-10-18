import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CreditCard } from 'lucide-react';

type OverviewCardsProps = {
  activeStudentsCount: number;
  pendingPaymentsCount: number;
};

export default function OverviewCards({
  activeStudentsCount,
  pendingPaymentsCount,
}: OverviewCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alunos Ativos</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeStudentsCount}</div>
          <p className="text-xs text-muted-foreground">
            Total de alunos com matrícula ativa
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Pagamentos Pendentes
          </CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingPaymentsCount}</div>
          <p className="text-xs text-muted-foreground">
            Alunos ativos com mensalidade pendente
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
