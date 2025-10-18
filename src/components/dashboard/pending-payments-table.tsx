import type { Student } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

type PendingPaymentsTableProps = {
  students: Student[];
};

export default function PendingPaymentsTable({
  students,
}: PendingPaymentsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pagamentos Pendentes</CardTitle>
        <CardDescription>
          Uma lista de alunos ativos com mensalidades pendentes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Status da Mensalidade</TableHead>
              <TableHead className="text-right">Data de Inscrição</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length > 0 ? (
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>
                    <Badge variant="destructive">{student.paymentStatus}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {format(new Date(student.enrollmentDate), 'dd/MM/yyyy')}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  Nenhum pagamento pendente.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
