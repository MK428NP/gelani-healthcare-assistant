"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Phone,
  Mail,
  Calendar,
  User,
  Heart,
  Activity,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  FileText,
  Stethoscope,
  Loader2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: string;
  bloodType?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  allergies?: string;
  chronicConditions?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  createdAt: string;
  consultations?: Consultation[];
  medications?: Medication[];
}

interface Consultation {
  id: string;
  consultationDate: string;
  chiefComplaint?: string;
  status: string;
}

interface Medication {
  id: string;
  medicationName: string;
  dosage?: string;
  status: string;
}

interface PatientManagementProps {
  onNavigate?: (moduleId: string, patientId?: string) => void;
}

// Ethiopian Cities
const ethiopianCities = [
  "Addis Ababa", "Dire Dawa", "Mekelle", "Gondar", "Bahir Dar",
  "Jimma", "Dessie", "Hawassa", "Adama", "Harar",
  "Jijiga", "Shashamane", "Debre Markos", "Debre Birhan", "Nekemte",
  "Arba Minch", "Wolisso", "Hosaena", "Kombolcha", "Sodo"
];

// Common Allergies
const commonAllergies = [
  "Penicillin", "Sulfa drugs", "Aspirin", "Ibuprofen", "Codeine",
  "Latex", "Peanuts", "Shellfish", "Eggs", "Milk",
  "Contrast Dye", "Iodine", "None Known", "Other"
];

// Common Chronic Conditions
const commonChronicConditions = [
  "Hypertension", "Type 2 Diabetes Mellitus", "Type 1 Diabetes Mellitus",
  "Asthma", "COPD", "Hypothyroidism", "Hyperthyroidism",
  "Rheumatoid Arthritis", "Chronic Kidney Disease", "Heart Failure",
  "Atrial Fibrillation", "Epilepsy", "HIV/AIDS", "Tuberculosis",
  "None", "Other"
];

export function PatientManagement({ onNavigate }: PatientManagementProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [otherAllergy, setOtherAllergy] = useState("");
  const [otherCondition, setOtherCondition] = useState("");
  const { toast } = useToast();

  const [newPatient, setNewPatient] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    bloodType: "",
    allergies: "",
    chronicConditions: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactPhone: "",
  });

  const fetchPatients = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/patients?search=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data.success) {
        setPatients(data.data.patients);
      }
    } catch (error) {
      console.error("Failed to fetch patients:", error);
      toast({
        title: "Error",
        description: "Failed to load patients",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, toast]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleCreatePatient = async () => {
    try {
      setIsSaving(true);
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newPatient,
          allergies: newPatient.allergies.split(",").map((a) => a.trim()).filter(Boolean),
          chronicConditions: newPatient.chronicConditions.split(",").map((c) => c.trim()).filter(Boolean),
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Patient created successfully",
        });
        setIsAddDialogOpen(false);
        setNewPatient({
          firstName: "",
          lastName: "",
          dateOfBirth: "",
          gender: "",
          phone: "",
          email: "",
          address: "",
          city: "",
          bloodType: "",
          allergies: "",
          chronicConditions: "",
          emergencyContactName: "",
          emergencyContactRelationship: "",
          emergencyContactPhone: "",
        });
        setSelectedAllergies([]);
        setSelectedConditions([]);
        setOtherAllergy("");
        setOtherCondition("");
        fetchPatients();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create patient",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const calculateAge = (dob: string) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    
    // Check if date is valid and not in the future
    if (isNaN(birthDate.getTime()) || birthDate > today) return null;
    
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();
    
    if (days < 0) {
      months--;
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
    }
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    // For infants under 1 year, show months and days
    if (years === 0) {
      if (months === 0) {
        return `${days} day${days !== 1 ? 's' : ''} old`;
      }
      return `${months} month${months !== 1 ? 's' : ''} ${days} day${days !== 1 ? 's' : ''} old`;
    }
    
    // For children under 3, show years and months
    if (years < 3 && months > 0) {
      return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''} old`;
    }
    
    return `${years} year${years !== 1 ? 's' : ''} old`;
  };

  // Calculate age for display
  const displayAge = calculateAge(newPatient.dateOfBirth);

  const parseJsonArray = (jsonStr?: string): string[] => {
    if (!jsonStr) return [];
    try {
      return JSON.parse(jsonStr);
    } catch {
      return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Patient Management</h2>
          <p className="text-slate-500">Manage patient records synced with Bahmni HIS</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
              <Plus className="h-4 w-4 mr-2" />
              New Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Register New Patient</DialogTitle>
              <DialogDescription>
                Add a new patient record. This will sync with Bahmni HIS.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="Enter first name"
                    value={newPatient.firstName}
                    onChange={(e) => setNewPatient({ ...newPatient, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Enter last name"
                    value={newPatient.lastName}
                    onChange={(e) => setNewPatient({ ...newPatient, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth *</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={newPatient.dateOfBirth}
                    onChange={(e) => setNewPatient({ ...newPatient, dateOfBirth: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Age</Label>
                  <div className={`flex items-center h-10 px-3 rounded-md border ${
                    displayAge 
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                      : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}>
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="font-medium">
                      {displayAge || "Will calculate automatically"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select
                  value={newPatient.gender}
                  onValueChange={(value) => setNewPatient({ ...newPatient, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="+1 555-0000"
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="patient@email.com"
                    value={newPatient.email}
                    onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter full address"
                  value={newPatient.address}
                  onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bloodType">Blood Type</Label>
                  <Select
                    value={newPatient.bloodType}
                    onValueChange={(value) => setNewPatient({ ...newPatient, bloodType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
                    <SelectContent>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Select
                    value={newPatient.city}
                    onValueChange={(value) => setNewPatient({ ...newPatient, city: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {ethiopianCities.map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Allergies Selection */}
              <div className="space-y-2">
                <Label>Allergies</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedAllergies.map((allergy) => (
                    <Badge
                      key={allergy}
                      variant="secondary"
                      className="cursor-pointer hover:bg-red-100 hover:text-red-700"
                      onClick={() => {
                        const updated = selectedAllergies.filter((a) => a !== allergy);
                        setSelectedAllergies(updated);
                        setNewPatient({ ...newPatient, allergies: updated.join(", ") });
                      }}
                    >
                      {allergy} <span className="ml-1">×</span>
                    </Badge>
                  ))}
                </div>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value === "Other") {
                      // Add "Other" placeholder to show input field
                      if (!selectedAllergies.includes("Other")) {
                        const updated = [...selectedAllergies, "Other"];
                        setSelectedAllergies(updated);
                        setOtherAllergy("");
                      }
                    } else if (!selectedAllergies.includes(value)) {
                      const updated = [...selectedAllergies, value];
                      setSelectedAllergies(updated);
                      setNewPatient({ ...newPatient, allergies: updated.join(", ") });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select allergies (click to add)" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonAllergies.filter((a) => !selectedAllergies.includes(a)).map((allergy) => (
                      <SelectItem key={allergy} value={allergy}>{allergy}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedAllergies.includes("Other") && (
                  <div className="mt-2 flex gap-2">
                    <Input
                      placeholder="Type the allergy name and press Enter to add"
                      value={otherAllergy}
                      onChange={(e) => setOtherAllergy(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && otherAllergy.trim()) {
                          // Replace "Other" with the typed value
                          const updated = selectedAllergies.map((a) => a === "Other" ? otherAllergy.trim() : a);
                          setSelectedAllergies(updated);
                          setNewPatient({ ...newPatient, allergies: updated.join(", ") });
                          setOtherAllergy("");
                        }
                      }}
                    />
                    <Button 
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (otherAllergy.trim()) {
                          const updated = selectedAllergies.map((a) => a === "Other" ? otherAllergy.trim() : a);
                          setSelectedAllergies(updated);
                          setNewPatient({ ...newPatient, allergies: updated.join(", ") });
                          setOtherAllergy("");
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                )}
              </div>

              {/* Chronic Conditions Selection */}
              <div className="space-y-2">
                <Label>Chronic Conditions</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedConditions.map((condition) => (
                    <Badge
                      key={condition}
                      variant="secondary"
                      className="cursor-pointer hover:bg-amber-100 hover:text-amber-700"
                      onClick={() => {
                        const updated = selectedConditions.filter((c) => c !== condition);
                        setSelectedConditions(updated);
                        setNewPatient({ ...newPatient, chronicConditions: updated.join(", ") });
                      }}
                    >
                      {condition} <span className="ml-1">×</span>
                    </Badge>
                  ))}
                </div>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value === "Other") {
                      // Add "Other" placeholder to show input field
                      if (!selectedConditions.includes("Other")) {
                        const updated = [...selectedConditions, "Other"];
                        setSelectedConditions(updated);
                        setOtherCondition("");
                      }
                    } else if (!selectedConditions.includes(value)) {
                      const updated = [...selectedConditions, value];
                      setSelectedConditions(updated);
                      setNewPatient({ ...newPatient, chronicConditions: updated.join(", ") });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select conditions (click to add)" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonChronicConditions.filter((c) => !selectedConditions.includes(c)).map((condition) => (
                      <SelectItem key={condition} value={condition}>{condition}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedConditions.includes("Other") && (
                  <div className="mt-2 flex gap-2">
                    <Input
                      placeholder="Type the condition name and press Enter to add"
                      value={otherCondition}
                      onChange={(e) => setOtherCondition(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && otherCondition.trim()) {
                          // Replace "Other" with the typed value
                          const updated = selectedConditions.map((c) => c === "Other" ? otherCondition.trim() : c);
                          setSelectedConditions(updated);
                          setNewPatient({ ...newPatient, chronicConditions: updated.join(", ") });
                          setOtherCondition("");
                        }
                      }}
                    />
                    <Button 
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (otherCondition.trim()) {
                          const updated = selectedConditions.map((c) => c === "Other" ? otherCondition.trim() : c);
                          setSelectedConditions(updated);
                          setNewPatient({ ...newPatient, chronicConditions: updated.join(", ") });
                          setOtherCondition("");
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Emergency Contact Section */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-amber-500" />
                  <h3 className="font-semibold text-slate-800">Emergency Contact *</h3>
                </div>
                <p className="text-sm text-slate-500 -mt-2">Required for patient safety and communication</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactName">Contact Name *</Label>
                    <Input
                      id="emergencyContactName"
                      placeholder="Full name of emergency contact"
                      value={newPatient.emergencyContactName}
                      onChange={(e) => setNewPatient({ ...newPatient, emergencyContactName: e.target.value })}
                      className={!newPatient.emergencyContactName ? "border-amber-300 focus:border-amber-500" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactRelationship">Relationship *</Label>
                    <Select
                      value={newPatient.emergencyContactRelationship}
                      onValueChange={(value) => setNewPatient({ ...newPatient, emergencyContactRelationship: value })}
                    >
                      <SelectTrigger className={!newPatient.emergencyContactRelationship ? "border-amber-300" : ""}>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="grandparent">Grandparent</SelectItem>
                        <SelectItem value="grandchild">Grandchild</SelectItem>
                        <SelectItem value="uncle_aunt">Uncle/Aunt</SelectItem>
                        <SelectItem value="cousin">Cousin</SelectItem>
                        <SelectItem value="friend">Friend</SelectItem>
                        <SelectItem value="guardian">Legal Guardian</SelectItem>
                        <SelectItem value="caregiver">Caregiver</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone">Contact Phone *</Label>
                  <Input
                    id="emergencyContactPhone"
                    type="tel"
                    placeholder="+1 555-0000"
                    value={newPatient.emergencyContactPhone}
                    onChange={(e) => setNewPatient({ ...newPatient, emergencyContactPhone: e.target.value })}
                    className={!newPatient.emergencyContactPhone ? "border-amber-300 focus:border-amber-500" : ""}
                  />
                  <p className="text-xs text-slate-400">Include country code for international numbers</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-gradient-to-r from-emerald-500 to-teal-500"
                onClick={handleCreatePatient}
                disabled={isSaving || !newPatient.firstName || !newPatient.lastName || !newPatient.dateOfBirth || !newPatient.gender || !newPatient.emergencyContactName || !newPatient.emergencyContactRelationship || !newPatient.emergencyContactPhone}
              >
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Register Patient
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name or MRN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Patient List */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Patient Cards */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Patient List</CardTitle>
              <CardDescription>
                {isLoading ? "Loading..." : `${patients.length} patients found`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                  </div>
                ) : patients.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[400px] text-center">
                    <User className="h-12 w-12 text-slate-300 mb-4" />
                    <h3 className="font-medium text-slate-600">No Patients Found</h3>
                    <p className="text-sm text-slate-400">Add your first patient to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {patients.map((patient) => {
                      const allergies = parseJsonArray(patient.allergies);
                      return (
                        <motion.div
                          key={patient.id}
                          whileHover={{ scale: 1.01 }}
                          className={`p-4 rounded-lg border cursor-pointer transition-all ${
                            selectedPatient?.id === patient.id
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                          onClick={() => setSelectedPatient(patient)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-emerald-100 text-emerald-700">
                                  {patient.firstName[0]}{patient.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-medium text-slate-800">
                                  {patient.firstName} {patient.lastName}
                                </h4>
                                <p className="text-sm text-slate-500">{patient.mrn}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {allergies.length > 0 && (
                                <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  {allergies.length} Allergies
                                </Badge>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Stethoscope className="h-4 w-4 mr-2" />
                                    New Consultation
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Documents
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Patient Details */}
        <div className="lg:col-span-1">
          {selectedPatient ? (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg">
                      {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{selectedPatient.firstName} {selectedPatient.lastName}</CardTitle>
                    <CardDescription>{selectedPatient.mrn}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="medical">Medical</TabsTrigger>
                    <TabsTrigger value="contact">Contact</TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500">Age</p>
                        <p className="font-semibold">{calculateAge(selectedPatient.dateOfBirth)}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500">Gender</p>
                        <p className="font-semibold capitalize">{selectedPatient.gender}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500">Blood Type</p>
                        <p className="font-semibold">{selectedPatient.bloodType || "Unknown"}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500">MRN</p>
                        <p className="font-semibold text-sm">{selectedPatient.mrn}</p>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-emerald-500" />
                        Quick Actions
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onNavigate?.('consultations', selectedPatient.id)}
                        >
                          <Stethoscope className="h-4 w-4 mr-2" />
                          Consult
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onNavigate?.('documentation', selectedPatient.id)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Records
                        </Button>
                      </div>
                    </div>
                    {selectedPatient.consultations && selectedPatient.consultations.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-medium mb-2">Recent Visits</h4>
                          <div className="space-y-2">
                            {selectedPatient.consultations.slice(0, 3).map((consultation) => (
                              <div key={consultation.id} className="p-2 bg-slate-50 rounded-lg text-sm">
                                <p className="font-medium">{consultation.chiefComplaint || "Consultation"}</p>
                                <p className="text-xs text-slate-500">
                                  {new Date(consultation.consultationDate).toLocaleDateString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </TabsContent>
                  <TabsContent value="medical" className="space-y-4 mt-4">
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        Allergies
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {parseJsonArray(selectedPatient.allergies).length > 0 ? (
                          parseJsonArray(selectedPatient.allergies).map((allergy, i) => (
                            <Badge key={i} variant="outline" className="bg-red-50 border-red-200 text-red-700">
                              {allergy}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">No known allergies</p>
                        )}
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Heart className="h-4 w-4 text-pink-500" />
                        Chronic Conditions
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {parseJsonArray(selectedPatient.chronicConditions).length > 0 ? (
                          parseJsonArray(selectedPatient.chronicConditions).map((condition, i) => (
                            <Badge key={i} variant="outline" className="bg-pink-50 border-pink-200 text-pink-700">
                              {condition}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">No chronic conditions</p>
                        )}
                      </div>
                    </div>
                    {selectedPatient.medications && selectedPatient.medications.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-medium mb-2">Active Medications</h4>
                          <div className="space-y-2">
                            {selectedPatient.medications.filter(m => m.status === 'active').map((med) => (
                              <div key={med.id} className="p-2 bg-slate-50 rounded-lg text-sm">
                                <p className="font-medium">{med.medicationName}</p>
                                {med.dosage && <p className="text-xs text-slate-500">{med.dosage}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </TabsContent>
                  <TabsContent value="contact" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">Phone</p>
                          <p className="font-medium">{selectedPatient.phone || "Not provided"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">Email</p>
                          <p className="font-medium">{selectedPatient.email || "Not provided"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">Date of Birth</p>
                          <p className="font-medium">
                            {new Date(selectedPatient.dateOfBirth).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {selectedPatient.address && (
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-xs text-slate-500 mb-1">Address</p>
                          <p className="font-medium text-sm">{selectedPatient.address}</p>
                          {selectedPatient.city && (
                            <p className="text-sm text-slate-600">{selectedPatient.city}</p>
                          )}
                        </div>
                      )}
                      {/* Emergency Contact in Patient Details */}
                      {(selectedPatient.emergencyContactName || selectedPatient.emergencyContactPhone) && (
                        <div className="mt-2 pt-3 border-t border-slate-200">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                            <p className="text-xs font-medium text-slate-600">Emergency Contact</p>
                          </div>
                          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <p className="font-medium text-sm text-slate-800">{selectedPatient.emergencyContactName}</p>
                            {selectedPatient.emergencyContactRelation && (
                              <p className="text-xs text-slate-500 capitalize">{selectedPatient.emergencyContactRelation.replace('_', ' ')}</p>
                            )}
                            {selectedPatient.emergencyContactPhone && (
                              <div className="flex items-center gap-2 mt-1">
                                <Phone className="h-3 w-3 text-slate-400" />
                                <p className="text-sm text-slate-700">{selectedPatient.emergencyContactPhone}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-md">
              <CardContent className="flex flex-col items-center justify-center h-[400px] text-center">
                <User className="h-12 w-12 text-slate-300 mb-4" />
                <h3 className="font-medium text-slate-600">No Patient Selected</h3>
                <p className="text-sm text-slate-400">Select a patient to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
