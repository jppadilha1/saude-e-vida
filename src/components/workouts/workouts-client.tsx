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
import { useWorkout } from '@/contexts/workout-context';
import { useStudent } from '@/contexts/student-context';
import { useMemo } from 'react';

const daysOfWeek = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const timeSlots = Array.from({ length: 15 }, (_, i) => {
  const hour = i + 7;
  return `${hour}:00-${hour + 1}:00`;
});

export default function WorkoutsClient() {
  const { workoutData } = useWorkout();
  const { students } = useStudent();

  const instructorStudentNames = useMemo(() => {
    return new Set(students.map(s => s.name));
  }, [students]);

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
                    const allStudentsInSlot = workoutData[day]?.[time] || [];
                    const visibleStudents = allStudentsInSlot.filter(name => instructorStudentNames.has(name));
                    
                    return (
                      <TableCell key={`${day}-${time}`} className="h-20 text-center border-r last:border-r-0">
                        {visibleStudents.join(', ')}
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
