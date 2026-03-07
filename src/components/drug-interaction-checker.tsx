"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Pill,
  Search,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Plus,
  X,
  Shield,
  Activity,
  Loader2,
  User,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  allergies?: string;
}

interface PatientMedication {
  id: string;
  medicationName: string;
  genericName?: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  status?: string;
  startDate?: string;
  endDate?: string | null;
  interactionAlerts?: string;
}

interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: "major" | "moderate" | "minor";
  description: string;
  clinicalEffects: string[];
  management: string;
  references: string[];
}

// Drug interaction database
const drugInteractionDB: DrugInteraction[] = [
  {
    drug1: "Warfarin",
    drug2: "Aspirin",
    severity: "major",
    description: "Increased risk of bleeding due to additive effects on hemostasis.",
    clinicalEffects: ["Increased INR", "Bleeding risk", "Bruising"],
    management: "Monitor INR more frequently. Consider alternative analgesic. Avoid combination if possible.",
    references: ["FDA Drug Safety Communication"],
  },
  {
    drug1: "Warfarin",
    drug2: "Ibuprofen",
    severity: "major",
    description: "NSAIDs enhance anticoagulant effect of warfarin, increasing bleeding risk.",
    clinicalEffects: ["GI bleeding", "Increased INR", "Hematuria"],
    management: "Avoid concurrent use. If necessary, use lowest effective dose for shortest duration.",
    references: ["Lexicomp Drug Interactions"],
  },
  {
    drug1: "Warfarin",
    drug2: "Metformin",
    severity: "minor",
    description: "Metformin may enhance the anticoagulant effect of warfarin.",
    clinicalEffects: ["Potential increased INR"],
    management: "Monitor INR when starting or stopping metformin.",
    references: ["Drug Interaction Facts"],
  },
  {
    drug1: "Lisinopril",
    drug2: "Ibuprofen",
    severity: "moderate",
    description: "NSAIDs may reduce the antihypertensive effect of ACE inhibitors.",
    clinicalEffects: ["Reduced BP control", "Potential renal impairment"],
    management: "Monitor blood pressure. Consider alternative pain management.",
    references: ["AHFS Drug Information"],
  },
  {
    drug1: "Metformin",
    drug2: "Omeprazole",
    severity: "minor",
    description: "Proton pump inhibitors may reduce metformin efficacy.",
    clinicalEffects: ["Reduced glycemic control"],
    management: "Monitor blood glucose. Adjust metformin dose if needed.",
    references: ["Drug Interaction Facts"],
  },
  {
    drug1: "Atorvastatin",
    drug2: "Warfarin",
    severity: "moderate",
    description: "Statins may enhance the anticoagulant effect of warfarin.",
    clinicalEffects: ["Increased INR", "Bleeding risk"],
    management: "Monitor INR closely when starting or adjusting statin therapy.",
    references: ["Clinical Pharmacology"],
  },
  {
    drug1: "Metformin",
    drug2: "Lisinopril",
    severity: "minor",
    description: "ACE inhibitors may enhance the hypoglycemic effect of antidiabetic agents.",
    clinicalEffects: ["Risk of hypoglycemia"],
    management: "Monitor blood glucose. May need to adjust antidiabetic dose.",
    references: ["Lexicomp"],
  },
  {
    drug1: "Aspirin",
    drug2: "Ibuprofen",
    severity: "moderate",
    description: "Ibuprofen may diminish the cardioprotective effect of aspirin.",
    clinicalEffects: ["Reduced cardiovascular protection"],
    management: "Take ibuprofen at least 8 hours after aspirin or 30 minutes before.",
    references: ["FDA Drug Safety"],
  },
];

// Common medications database for quick add
const commonMedications = [
  { name: "Metformin", genericName: "Metformin Hydrochloride", commonDosage: "500mg" },
  { name: "Lisinopril", genericName: "Lisinopril", commonDosage: "10mg" },
  { name: "Atorvastatin", genericName: "Atorvastatin Calcium", commonDosage: "20mg" },
  { name: "Aspirin", genericName: "Acetylsalicylic Acid", commonDosage: "81mg" },
  { name: "Omeprazole", genericName: "Omeprazole", commonDosage: "20mg" },
  { name: "Warfarin", genericName: "Warfarin Sodium", commonDosage: "5mg" },
  { name: "Ibuprofen", genericName: "Ibuprofen", commonDosage: "400mg" },
  { name: "Metoprolol", genericName: "Metoprolol Tartrate", commonDosage: "25mg" },
  { name: "Amlodipine", genericName: "Amlodipine Besylate", commonDosage: "5mg" },
  { name: "Levothyroxine", genericName: "Levothyroxine Sodium", commonDosage: "50mcg" },
];

export function DrugInteractionChecker() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [patientMedications, setPatientMedications] = useState<PatientMedication[]>([]);
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingMed, setIsAddingMed] = useState(false);
  const [searchMed, setSearchMed] = useState("");
  const { toast } = useToast();

  // Fetch all patients
  useEffect(() => {
    fetchPatients();
  }, []);

  // Fetch patient medications when patient is selected
  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientMedications(selectedPatientId);
    } else {
      setPatientMedications([]);
      setInteractions([]);
    }
  }, [selectedPatientId]);

  const fetchPatients = async () => {
    try {
      const response = await fetch("/api/patients?limit=100");
      const data = await response.json();
      if (data.success) {
        setPatients(data.data.patients);
      }
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    }
  };

  const fetchPatientMedications = async (patientId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/patients/${patientId}/medications`);
      const data = await response.json();
      if (data.success) {
        setPatientMedications(data.data.medications);
        // Check for interactions
        checkInteractions(data.data.medications);
      }
    } catch (error) {
      console.error("Failed to fetch medications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkInteractions = (medications: PatientMedication[]) => {
    const medNames = medications.map((m) => m.medicationName.toLowerCase());
    const foundInteractions: DrugInteraction[] = [];

    for (const interaction of drugInteractionDB) {
      const drug1Match = medNames.some((m) => interaction.drug1.toLowerCase().includes(m) || m.includes(interaction.drug1.toLowerCase()));
      const drug2Match = medNames.some((m) => interaction.drug2.toLowerCase().includes(m) || m.includes(interaction.drug2.toLowerCase()));

      if (drug1Match && drug2Match) {
        foundInteractions.push(interaction);
      }
    }

    setInteractions(foundInteractions);
  };

  const addMedication = async (medName: string, dosage: string) => {
    if (!selectedPatientId) return;

    try {
      const response = await fetch("/api/patients/medications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatientId,
          medicationName: medName,
          dosage: dosage,
          frequency: "As prescribed",
          status: "active",
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Medication Added",
          description: `${medName} added to patient's medication list`,
        });
        fetchPatientMedications(selectedPatientId);
        setIsAddingMed(false);
        setSearchMed("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add medication",
        variant: "destructive",
      });
    }
  };

  const removeMedication = async (medicationId: string) => {
    try {
      const response = await fetch(`/api/patients/medications/${medicationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Medication Removed",
          description: "Medication has been discontinued",
        });
        if (selectedPatientId) {
          fetchPatientMedications(selectedPatientId);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove medication",
        variant: "destructive",
      });
    }
  };

  const getSelectedPatient = () => {
    return patients.find((p) => p.id === selectedPatientId);
  };

  const parseAllergies = (allergies?: string): string[] => {
    if (!allergies) return [];
    try {
      return JSON.parse(allergies);
    } catch {
      return [];
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "major":
        return {
          badge: "bg-red-100 text-red-700 border-red-200",
          bg: "bg-red-50 border-red-200",
          icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
        };
      case "moderate":
        return {
          badge: "bg-amber-100 text-amber-700 border-amber-200",
          bg: "bg-amber-50 border-amber-200",
          icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
        };
      default:
        return {
          badge: "bg-blue-100 text-blue-700 border-blue-200",
          bg: "bg-blue-50 border-blue-200",
          icon: <Info className="h-5 w-5 text-blue-500" />,
        };
    }
  };

  const filteredMeds = commonMedications.filter(
    (med) =>
      med.name.toLowerCase().includes(searchMed.toLowerCase()) &&
      !patientMedications.some((pm) => pm.medicationName.toLowerCase() === med.name.toLowerCase())
  );

  const selectedPatient = getSelectedPatient();
  const patientAllergies = selectedPatient ? parseAllergies(selectedPatient.allergies) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Pill className="h-6 w-6 text-rose-500" />
            Drug Safety
          </h2>
          <p className="text-slate-500">Patient-specific medication tracking and interaction checking</p>
        </div>
        <Badge variant="outline" className="bg-rose-50 border-rose-200 text-rose-700 w-fit">
          <Shield className="h-3 w-3 mr-1" />
          Real-time Analysis
        </Badge>
      </div>

      {/* Patient Selection */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Select Patient</CardTitle>
          <CardDescription>Choose a patient to view and manage their medications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Select a patient..." />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName} ({patient.mrn})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedPatient && (
              <div className="flex items-center gap-4 flex-1">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-rose-100 text-rose-700">
                    {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                  <p className="text-sm text-slate-500">{selectedPatient.mrn}</p>
                </div>
                {patientAllergies.length > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600">{patientAllergies.length} Allergies</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {patientAllergies.length > 0 && selectedPatient && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm font-medium text-red-800 mb-2">Known Allergies:</p>
              <div className="flex flex-wrap gap-2">
                {patientAllergies.map((allergy, i) => (
                  <Badge key={i} variant="outline" className="bg-white border-red-300 text-red-700">
                    {allergy}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPatientId ? (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Patient Medications */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Current Medications</CardTitle>
                  <CardDescription>{patientMedications.length} active medications</CardDescription>
                </div>
                <Button
                  onClick={() => setIsAddingMed(!isAddingMed)}
                  size="sm"
                  className="bg-gradient-to-r from-rose-500 to-pink-500"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Medication
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isAddingMed && (
                <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                  <Label className="text-sm font-medium">Search Medications</Label>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search medications..."
                      value={searchMed}
                      onChange={(e) => setSearchMed(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {searchMed && filteredMeds.length > 0 && (
                    <ScrollArea className="h-[200px] mt-2 border rounded-lg">
                      <div className="p-2 space-y-1">
                        {filteredMeds.map((med) => (
                          <button
                            key={med.name}
                            onClick={() => addMedication(med.name, med.commonDosage)}
                            className="w-full flex items-center justify-between p-2 hover:bg-slate-100 rounded text-left"
                          >
                            <div>
                              <p className="font-medium text-sm">{med.name}</p>
                              <p className="text-xs text-slate-500">{med.commonDosage}</p>
                            </div>
                            <Plus className="h-4 w-4 text-slate-400" />
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}

              {isLoading ? (
                <div className="flex items-center justify-center h-[200px]">
                  <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
                </div>
              ) : patientMedications.length === 0 ? (
                <div className="text-center py-8">
                  <Pill className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No medications recorded</p>
                  <p className="text-sm text-slate-400">Click "Add Medication" to get started</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {patientMedications.map((med) => (
                      <motion.div
                        key={med.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-rose-100 rounded-lg">
                            <Pill className="h-4 w-4 text-rose-600" />
                          </div>
                          <div>
                            <p className="font-medium">{med.medicationName}</p>
                            <p className="text-sm text-slate-500">
                              {med.dosage} • {med.frequency}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {med.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => removeMedication(med.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Interaction Results */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Drug Interactions</CardTitle>
              <CardDescription>
                {interactions.length > 0
                  ? `${interactions.length} interaction(s) detected`
                  : "No interactions detected"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {interactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                  <CheckCircle className="h-12 w-12 text-emerald-400 mb-3" />
                  <h3 className="font-medium text-emerald-600">No Interactions Found</h3>
                  <p className="text-sm text-slate-400">Current medications appear safe together</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    {interactions.map((interaction, i) => {
                      const styles = getSeverityStyles(interaction.severity);
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-lg border ${styles.bg}`}
                        >
                          <div className="flex items-start gap-3">
                            {styles.icon}
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold">
                                  {interaction.drug1} + {interaction.drug2}
                                </h4>
                                <Badge className={styles.badge}>
                                  {interaction.severity.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-sm mb-3">{interaction.description}</p>
                              <div className="space-y-2">
                                <div>
                                  <p className="text-xs font-medium text-slate-600 mb-1">Clinical Effects:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {interaction.clinicalEffects.map((effect, j) => (
                                      <Badge key={j} variant="outline" className="text-xs">
                                        {effect}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-slate-600 mb-1">Management:</p>
                                  <p className="text-sm">{interaction.management}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center h-[400px] text-center">
            <User className="h-16 w-16 text-slate-300 mb-4" />
            <h3 className="font-medium text-slate-600">Select a Patient</h3>
            <p className="text-sm text-slate-400">Choose a patient above to view and manage their medications</p>
          </CardContent>
        </Card>
      )}

      {/* Severity Legend */}
      <Card className="border-0 shadow-md bg-slate-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium">Interaction Severity Levels</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium text-red-700 text-sm">Major</p>
                <p className="text-xs text-slate-500">Avoid combination. High risk.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-medium text-amber-700 text-sm">Moderate</p>
                <p className="text-xs text-slate-500">Monitor closely. Adjust therapy.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <Info className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium text-blue-700 text-sm">Minor</p>
                <p className="text-xs text-slate-500">Low risk. Monitor if needed.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Label component
function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <label className={`text-sm font-medium leading-none ${className}`}>{children}</label>;
}
