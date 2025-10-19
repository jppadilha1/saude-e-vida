'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Dados de exemplo para os treinos
const workoutData = {
  'Segunda-feira': {
    '7:00-8:00': 'João, Maria',
    '9:00-10:00': 'Carlos (Personal)',
    '18:00-19:00': 'Ana, Sofia, Lucas',
  },
  'Terça-feira': {
    '8:00-9:00': 'Ana, Pedro',
    '19:00-20:00': 'Julia, Rafael, Clara',
  },
  'Quarta-feira': {
    '7:00-8:00': 'José, Lúcia',
    '9:00-10:00': 'Carlos (Personal)',
    '18:00-19:00': 'Mateus, Gabriela',
  },
  'Quinta-feira': {
    '8:00-9:00': 'Mariana, Fernando',
    '19:00-20:00': 'Beatriz, Gustavo',
  },
  'Sexta-feira': {
    '7:00-8:00': 'Bia, Tiago',
    '9:00-10:00': 'Carlos (Personal)',
    '17:00-18:00': 'Larissa, Heitor',
  },
  'Sábado': {
    '10:00-11:00': 'Daniel, Manuela',
  },
  'Domingo': {},
};

const daysOfWeek = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
const timeSlots = Array.from({ length: 15 }, (_, i) => {
  const hour = i + 7;
  return `${hour}:00-${hour + 1}:00`;
});

export default function WorkoutsClient() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agenda Semanal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px] text-center font-bold border-r">Horário</TableHead>
                {daysOfWeek.map((day) => (
                  <TableHead key={day} className="text-center font-bold border-r last:border-r-0">{day}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeSlots.map((time) => (
                <TableRow key={time}>
                  <TableCell className="text-center font-medium text-muted-foreground border-r">{time}</TableCell>
                  {daysOfWeek.map((day) => {
                    const workout = (workoutData as any)[day]?.[time] || '';
                    return (
                      <TableCell key={`${day}-${time}`} className="h-20 text-center border-r last:border-r-0">
                        {workout}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
