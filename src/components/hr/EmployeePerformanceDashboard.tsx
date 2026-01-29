import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, Clock, Phone, MessageSquare, TrendingUp, Users, Eye } from "lucide-react";

// Placeholder component until migration is applied
export function EmployeePerformanceDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] border-2 border-gold/30 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-600">Total Hours Today</p>
                <p className="text-2xl font-bold text-black">0h 0m</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] border-2 border-gold/30 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-600">Calls Made</p>
                <p className="text-2xl font-bold text-black">0</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Phone className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] border-2 border-gold/30 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-600">Messages Sent</p>
                <p className="text-2xl font-bold text-black">0</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] border-2 border-gold/30 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-600">Leads Contacted</p>
                <p className="text-2xl font-bold text-black">0</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-gold" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#F5EBD7] border-2 border-gold/30 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black">
            <Activity className="h-5 w-5 text-gold" />
            Employee Performance Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-600 text-center py-8">
            Please approve the database migration to enable performance tracking
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
