import { Dumbbell } from 'lucide-react';

export default function Logo() {
  return (
    <div className="flex items-center gap-2 text-primary">
      <Dumbbell className="h-7 w-7" />
      <span className="font-headline text-xl font-bold">Saúde e Vida</span>
    </div>
  );
}
