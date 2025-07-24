import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useStudents } from "@/hooks/useStudents";
import { 
  Plus, 
  Search, 
  Users, 
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Loader2
} from "lucide-react";

const Students = () => {
  const { students, loading, addStudent, updateStudent, deleteStudent } = useStudents();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: "",
    grade: "",
    gender: "",
    date_of_birth: "",
    contact_info: ""
  });

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = selectedGrade === "all" || student.grade === selectedGrade;
    return matchesSearch && matchesGrade;
  });

  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.grade || !newStudent.gender) {
      toast.error("Please fill in all required fields");
      return;
    }

    const studentData = {
      name: newStudent.name,
      grade: newStudent.grade,
      gender: newStudent.gender,
      date_of_birth: newStudent.date_of_birth || null,
      contact_info: newStudent.contact_info ? { contact: newStudent.contact_info } : null
    };

    const result = await addStudent(studentData);
    if (result) {
      setNewStudent({
        name: "",
        grade: "",
        gender: "",
        date_of_birth: "",
        contact_info: ""
      });
      setIsAddDialogOpen(false);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    await deleteStudent(id);
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 70) return "secondary";
    return "destructive";
  };

  const getAttendanceBadgeVariant = (rate: number) => {
    if (rate >= 90) return "default";
    if (rate >= 80) return "secondary";
    return "destructive";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Students</h1>
          <p className="text-muted-foreground">Manage student profiles and information</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-secondary text-white">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>
                Enter the student's information to add them to the system.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name *</Label>
                <Input
                  id="name"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                  className="col-span-3"
                  placeholder="Student's full name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="grade" className="text-right">Grade *</Label>
                <Select value={newStudent.grade} onValueChange={(value) => setNewStudent({...newStudent, grade: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Grade 9">Grade 9</SelectItem>
                    <SelectItem value="Grade 10">Grade 10</SelectItem>
                    <SelectItem value="Grade 11">Grade 11</SelectItem>
                    <SelectItem value="Grade 12">Grade 12</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="gender" className="text-right">Gender *</Label>
                <Select value={newStudent.gender} onValueChange={(value) => setNewStudent({...newStudent, gender: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date_of_birth" className="text-right">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={newStudent.date_of_birth}
                  onChange={(e) => setNewStudent({...newStudent, date_of_birth: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contact_info" className="text-right">Contact Info</Label>
                <Input
                  id="contact_info"
                  value={newStudent.contact_info}
                  onChange={(e) => setNewStudent({...newStudent, contact_info: e.target.value})}
                  className="col-span-3"
                  placeholder="Phone, email, etc."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddStudent}>Add Student</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Search & Filter</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search students by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  <SelectItem value="Grade 9">Grade 9</SelectItem>
                  <SelectItem value="Grade 10">Grade 10</SelectItem>
                  <SelectItem value="Grade 11">Grade 11</SelectItem>
                  <SelectItem value="Grade 12">Grade 12</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Students ({filteredStudents.length})</span>
          </CardTitle>
          <CardDescription>
            Manage student profiles and view their performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredStudents.map((student) => (
                  <Card key={student.id} className="border border-border hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{student.name}</CardTitle>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteStudent(student.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{student.grade}</Badge>
                        <Badge variant="outline">{student.gender}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {student.date_of_birth && (
                          <p><span className="font-medium">DOB:</span> {new Date(student.date_of_birth).toLocaleDateString()}</p>
                        )}
                        {student.contact_info && (
                          <p><span className="font-medium">Contact:</span> {JSON.stringify(student.contact_info)}</p>
                        )}
                        <p><span className="font-medium">Added:</span> {new Date(student.created_at).toLocaleDateString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {filteredStudents.length === 0 && !loading && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No students found matching your criteria.</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Students;