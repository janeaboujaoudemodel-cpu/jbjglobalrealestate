import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  UserCheck,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  Eye,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import type { CVCandidate } from './CVRankingCard';

interface EmployeesListCardProps {
  employees: CVCandidate[];
  onView: (id: string) => void;
}

const EmployeesListCard = ({ employees, onView }: EmployeesListCardProps) => {
  const newEmployees = employees.filter(e => {
    const daysSinceApproval = Math.floor((Date.now() - e.uploadDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceApproval <= 30;
  });

  const existingEmployees = employees.filter(e => {
    const daysSinceApproval = Math.floor((Date.now() - e.uploadDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceApproval > 30;
  });

  const EmployeeRow = ({ employee, isNew = false }: { employee: CVCandidate; isNew?: boolean }) => (
    <div
      key={employee.id}
      className={`flex items-center justify-between p-3 rounded-lg border transition-colors hover:bg-muted/30 ${
        isNew ? 'bg-green-500/5 border-green-500/20' : 'bg-background/50 border-border'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#EFE6D6]/20 flex items-center justify-center">
          <span className="font-bold text-[#1A1A1A]">
            {employee.candidateName.charAt(0)}
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-white">{employee.candidateName}</p>
            {isNew && (
              <Badge className="bg-green-600/20 text-green-400 text-xs border-green-500/30">
                New
              </Badge>
            )}
          </div>
          <p className="text-sm text-[#1A1A1A]">{employee.position}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {employee.email}
          </span>
          <span className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {employee.phone}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border">
            <DropdownMenuItem onClick={() => onView(employee.id)} className="text-white hover:bg-muted">
              <Eye className="h-4 w-4 mr-2" />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-white hover:bg-muted">
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </DropdownMenuItem>
            <DropdownMenuItem className="text-white hover:bg-muted">
              <Phone className="h-4 w-4 mr-2" />
              Call
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* New Employees Section */}
      {newEmployees.length > 0 && (
        <Card className="bg-card border-green-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-400" />
              New Employees
              <Badge className="ml-2 bg-green-600">{newEmployees.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {newEmployees.map(employee => (
              <EmployeeRow key={employee.id} employee={employee} isNew />
            ))}
          </CardContent>
        </Card>
      )}

      {/* All Employees Section */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-[#1A1A1A]" />
            All Employees
            <Badge className="ml-2 bg-muted text-muted-foreground">{employees.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {employees.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No approved employees yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Approved candidates will appear here
              </p>
            </div>
          ) : (
            employees.map(employee => (
              <EmployeeRow key={employee.id} employee={employee} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeesListCard;
