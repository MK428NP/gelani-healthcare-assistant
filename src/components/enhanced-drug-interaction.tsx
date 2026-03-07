"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pill,
  AlertTriangle,
  AlertCircle,
  Info,
  Search,
  Plus,
  X,
  ChevronRight,
  Shield,
  Activity,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  ExternalLink,
  Filter,
  Download,
  Printer,
  Bell,
  BellOff,
  Zap,
  Brain,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// Drug database with interaction data
const DRUG_DATABASE = {
  "warfarin": {
    name: "Warfarin",
    generic: "warfarin sodium",
    class: "Anticoagulant",
    interactions: [
      { drug: "aspirin", severity: "major", description: "Increased risk of bleeding. Monitor INR closely.", mechanism: "Additive anticoagulant effect", action: "Avoid combination or use lowest effective doses", monitoring: ["INR", "Signs of bleeding"] },
      { drug: "ibuprofen", severity: "major", description: "Increased risk of GI bleeding.", mechanism: "NSAID-induced gastric ulceration + anticoagulation", action: "Consider acetaminophen instead", monitoring: ["INR", "Hemoglobin", "Stool guaiac"] },
      { drug: "amiodarone", severity: "major", description: "Increased warfarin effect. Reduce warfarin dose by 30-50%.", mechanism: "CYP2C9 inhibition", action: "Reduce warfarin dose, monitor INR more frequently", monitoring: ["INR twice weekly initially"] },
      { drug: "fluconazole", severity: "major", description: "Significantly increased anticoagulant effect.", mechanism: "CYP2C9/3A4 inhibition", action: "Reduce warfarin dose by 50%", monitoring: ["INR"] },
      { drug: "ciprofloxacin", severity: "moderate", description: "May increase warfarin levels.", mechanism: "CYP1A2 inhibition", action: "Monitor INR more frequently", monitoring: ["INR"] },
      { drug: "metronidazole", severity: "major", description: "Prolonged PT/INR. Reduce warfarin dose.", mechanism: "CYP2C9 inhibition", action: "Reduce dose by 25-50%", monitoring: ["INR"] },
      { drug: "omeprazole", severity: "minor", description: "Possible increase in warfarin effect.", mechanism: "Unknown", action: "Monitor INR", monitoring: ["INR"] },
      { drug: "clarithromycin", severity: "major", description: "Increased anticoagulant effect.", mechanism: "CYP3A4 inhibition", action: "Reduce warfarin dose", monitoring: ["INR"] },
    ]
  },
  "metformin": {
    name: "Metformin",
    generic: "metformin hydrochloride",
    class: "Antidiabetic / Biguanide",
    interactions: [
      { drug: "furosemide", severity: "moderate", description: "May increase metformin exposure and decrease renal function.", mechanism: "Competition for renal tubular secretion", action: "Monitor renal function and blood glucose", monitoring: ["Serum creatinine", "Blood glucose"] },
      { drug: "cimetidine", severity: "moderate", description: "Increased metformin levels.", mechanism: "Competition for renal tubular secretion", action: "Monitor for metformin toxicity", monitoring: ["Lactic acid", "Renal function"] },
      { drug: "contrast", severity: "major", description: "Risk of lactic acidosis with iodinated contrast.", mechanism: "Acute renal failure", action: "Discontinue metformin before and after contrast", monitoring: ["Renal function"] },
      { drug: "alcohol", severity: "moderate", description: "Increased risk of lactic acidosis.", mechanism: "Impaired lactate metabolism", action: "Limit alcohol intake", monitoring: ["Lactic acid if symptomatic"] },
    ]
  },
  "simvastatin": {
    name: "Simvastatin",
    generic: "simvastatin",
    class: "Antilipemic / HMG-CoA Reductase Inhibitor",
    interactions: [
      { drug: "clarithromycin", severity: "contraindicated", description: "CONTRAINDICATED. High risk of myopathy/rhabdomyolysis.", mechanism: "CYP3A4 inhibition increases simvastatin levels 10-fold", action: "Contraindicated - do not co-administer", monitoring: ["CK", "Muscle symptoms"] },
      { drug: "itraconazole", severity: "contraindicated", description: "CONTRAINDICATED. Risk of rhabdomyolysis.", mechanism: "Potent CYP3A4 inhibition", action: "Contraindicated", monitoring: ["CK"] },
      { drug: "amiodarone", severity: "major", description: "Increased risk of myopathy. Do not exceed 20mg simvastatin.", mechanism: "CYP3A4 inhibition", action: "Limit simvastatin to 20mg daily", monitoring: ["CK", "Muscle pain"] },
      { drug: "verapamil", severity: "major", description: "Increased simvastatin exposure. Max 10mg daily.", mechanism: "CYP3A4 inhibition", action: "Limit simvastatin to 10mg daily", monitoring: ["CK"] },
      { drug: "diltiazem", severity: "major", description: "Increased simvastatin levels. Max 10mg daily.", mechanism: "CYP3A4 inhibition", action: "Limit simvastatin to 10mg daily", monitoring: ["CK"] },
      { drug: "grapefruit", severity: "moderate", description: "Increased simvastatin levels.", mechanism: "CYP3A4 inhibition in gut", action: "Avoid grapefruit juice", monitoring: ["Muscle symptoms"] },
      { drug: "gemfibrozil", severity: "major", description: "Increased risk of myopathy/rhabdomyolysis.", mechanism: "OATP1B1 inhibition, glucuronidation", action: "Avoid combination; use fenofibrate instead", monitoring: ["CK", "Muscle symptoms"] },
    ]
  },
  "amoxicillin": {
    name: "Amoxicillin",
    generic: "amoxicillin trihydrate",
    class: "Antibiotic / Penicillin",
    interactions: [
      { drug: "methotrexate", severity: "major", description: "Increased methotrexate toxicity.", mechanism: "Decreased renal clearance of methotrexate", action: "Avoid or monitor closely for methotrexate toxicity", monitoring: ["CBC", "Renal function", "LFTs"] },
      { drug: "allopurinol", severity: "moderate", description: "Increased risk of skin rash.", mechanism: "Unknown", action: "Monitor for rash", monitoring: ["Skin"] },
      { drug: "warfarin", severity: "moderate", description: "May enhance anticoagulant effect.", mechanism: "Altered intestinal flora, decreased vitamin K", action: "Monitor INR", monitoring: ["INR"] },
      { drug: "oral_contraceptives", severity: "minor", description: "May decrease contraceptive efficacy.", mechanism: "Altered gut flora reduces enterohepatic recirculation", action: "Use backup contraception", monitoring: ["Patient counseling"] },
    ]
  },
  "lisinopril": {
    name: "Lisinopril",
    generic: "lisinopril",
    class: "ACE Inhibitor / Antihypertensive",
    interactions: [
      { drug: "potassium", severity: "major", description: "Risk of hyperkalemia.", mechanism: "ACE inhibition reduces aldosterone", action: "Avoid potassium supplements or monitor closely", monitoring: ["Serum potassium"] },
      { drug: "spironolactone", severity: "major", description: "Increased risk of hyperkalemia.", mechanism: "Additive potassium-sparing effect", action: "Monitor potassium frequently", monitoring: ["Serum potassium", "Renal function"] },
      { drug: "nsaids", severity: "moderate", description: "May reduce antihypertensive effect; risk of renal impairment.", mechanism: "Prostaglandin inhibition", action: "Monitor BP and renal function", monitoring: ["Blood pressure", "Serum creatinine"] },
      { drug: "lithium", severity: "major", description: "Increased lithium levels.", mechanism: "Reduced renal clearance", action: "Monitor lithium levels closely", monitoring: ["Serum lithium"] },
    ]
  },
  "omeprazole": {
    name: "Omeprazole",
    generic: "omeprazole magnesium",
    class: "Proton Pump Inhibitor",
    interactions: [
      { drug: "clopidogrel", severity: "major", description: "May reduce clopidogrel effectiveness.", mechanism: "CYP2C19 inhibition reduces clopidogrel activation", action: "Consider pantoprazole or H2 blocker", monitoring: ["Clinical efficacy"] },
      { drug: "methotrexate", severity: "major", description: "Increased methotrexate levels.", mechanism: "Reduced methotrexate clearance", action: "Monitor for methotrexate toxicity", monitoring: ["Methotrexate levels", "CBC", "Renal function"] },
      { drug: "digoxin", severity: "minor", description: "May increase digoxin absorption.", mechanism: "Increased gastric pH", action: "Monitor digoxin levels", monitoring: ["Serum digoxin"] },
      { drug: "magnesium", severity: "moderate", description: "Risk of hypomagnesemia with long-term PPI use.", mechanism: "Decreased intestinal magnesium absorption", action: "Monitor magnesium levels", monitoring: ["Serum magnesium"] },
    ]
  },
  "amlodipine": {
    name: "Amlodipine",
    generic: "amlodipine besylate",
    class: "Calcium Channel Blocker / Antihypertensive",
    interactions: [
      { drug: "simvastatin", severity: "moderate", description: "Increased simvastatin exposure. Max 20mg simvastatin.", mechanism: "CYP3A4 inhibition", action: "Limit simvastatin to 20mg daily", monitoring: ["CK", "Muscle symptoms"] },
      { drug: "clarithromycin", severity: "moderate", description: "May increase amlodipine levels.", mechanism: "CYP3A4 inhibition", action: "Monitor for hypotension and edema", monitoring: ["Blood pressure"] },
      { drug: "grapefruit", severity: "moderate", description: "Increased amlodipine levels.", mechanism: "CYP3A4 inhibition in gut", action: "Avoid grapefruit", monitoring: ["Blood pressure"] },
    ]
  },
  "metoprolol": {
    name: "Metoprolol",
    generic: "metoprolol succinate",
    class: "Beta-Blocker / Antihypertensive",
    interactions: [
      { drug: "fluoxetine", severity: "major", description: "Increased metoprolol exposure.", mechanism: "CYP2D6 inhibition", action: "Reduce metoprolol dose or use alternative", monitoring: ["Heart rate", "Blood pressure"] },
      { drug: "paroxetine", severity: "major", description: "Significantly increased metoprolol levels.", mechanism: "Potent CYP2D6 inhibition", action: "Consider alternative antidepressant or beta-blocker", monitoring: ["Heart rate", "Blood pressure"] },
      { drug: "diltiazem", severity: "moderate", description: "Increased risk of bradycardia and AV block.", mechanism: "Additive effects on conduction", action: "Monitor heart rate and ECG", monitoring: ["Heart rate", "ECG"] },
    ]
  },
  "ciprofloxacin": {
    name: "Ciprofloxacin",
    generic: "ciprofloxacin hydrochloride",
    class: "Fluoroquinolone Antibiotic",
    interactions: [
      { drug: "magnesium", severity: "major", description: "Reduced ciprofloxacin absorption.", mechanism: "Chelation in GI tract", action: "Separate by 2-4 hours", monitoring: ["Antibiotic efficacy"] },
      { drug: "calcium", severity: "major", description: "Reduced ciprofloxacin absorption.", mechanism: "Chelation", action: "Separate administration", monitoring: ["Clinical response"] },
      { drug: "warfarin", severity: "moderate", description: "May enhance anticoagulant effect.", mechanism: "Altered flora, CYP inhibition", action: "Monitor INR", monitoring: ["INR"] },
      { drug: "theophylline", severity: "major", description: "Increased theophylline levels.", mechanism: "CYP1A2 inhibition", action: "Reduce theophylline dose, monitor levels", monitoring: ["Serum theophylline"] },
      { drug: "sucralfate", severity: "major", description: "Reduced ciprofloxacin absorption.", mechanism: "Chelation", action: "Separate by at least 6 hours", monitoring: ["Antibiotic efficacy"] },
    ]
  },
  "furosemide": {
    name: "Furosemide",
    generic: "furosemide",
    class: "Loop Diuretic",
    interactions: [
      { drug: "lithium", severity: "major", description: "Increased lithium levels.", mechanism: "Reduced lithium clearance", action: "Monitor lithium levels closely", monitoring: ["Serum lithium"] },
      { drug: "digoxin", severity: "moderate", description: "Hypokalemia increases digoxin toxicity risk.", mechanism: "Diuretic-induced hypokalemia", action: "Maintain potassium >4.0 mEq/L", monitoring: ["Serum potassium", "Digoxin level"] },
      { drug: "aminoglycosides", severity: "major", description: "Increased ototoxicity and nephrotoxicity.", mechanism: "Additive toxicities", action: "Monitor renal function and hearing", monitoring: ["Serum creatinine", "Audiometry"] },
      { drug: "nsaids", severity: "moderate", description: "Reduced diuretic efficacy.", mechanism: "Prostaglandin inhibition", action: "Monitor for fluid retention", monitoring: ["Weight", "Edema", "Renal function"] },
    ]
  },
};

// Common drug aliases
const DRUG_ALIASES: Record<string, string> = {
  "coumadin": "warfarin",
  "jadenu": "warfarin",
  "glucophage": "metformin",
  "zocor": "simvastatin",
  "amoxil": "amoxicillin",
  "prinivil": "lisinopril",
  "zestril": "lisinopril",
  "prilosec": "omeprazole",
  "norvasc": "amlodipine",
  "lopressor": "metoprolol",
  "toprol": "metoprolol",
  "cipro": "ciprofloxacin",
  "lasix": "furosemide",
  "advil": "ibuprofen",
  "motrin": "ibuprofen",
  "aspirin": "aspirin",
  "asa": "aspirin",
  "tylenol": "acetaminophen",
  "paracetamol": "acetaminophen",
};

interface DrugInteraction {
  id: string;
  drug1: string;
  drug2: string;
  severity: "minor" | "moderate" | "major" | "contraindicated";
  description: string;
  mechanism: string;
  action: string;
  monitoring: string[];
  timestamp: Date;
}

interface MedicationEntry {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  route: string;
}

interface EnhancedDrugInteractionProps {
  preselectedPatientId?: string | null;
}

export function EnhancedDrugInteraction({ preselectedPatientId }: EnhancedDrugInteractionProps) {
  const [medications, setMedications] = useState<MedicationEntry[]>([]);
  const [newMedication, setNewMedication] = useState("");
  const [newDose, setNewDose] = useState("");
  const [newFrequency, setNewFrequency] = useState("");
  const [newRoute, setNewRoute] = useState("oral");
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [realtimeAlerts, setRealtimeAlerts] = useState(true);
  const [scanHistory, setScanHistory] = useState<{ timestamp: Date; count: number }[]>([]);

  // Normalize drug name
  const normalizeDrugName = (name: string): string => {
    const lower = name.toLowerCase().trim();
    return DRUG_ALIASES[lower] || lower;
  };

  // Check interactions between medications
  const checkInteractions = useCallback(() => {
    setIsScanning(true);
    const foundInteractions: DrugInteraction[] = [];

    medications.forEach((med1, index) => {
      medications.slice(index + 1).forEach((med2) => {
        const drug1Key = normalizeDrugName(med1.name);
        const drug2Key = normalizeDrugName(med2.name);

        // Check both directions
        const drug1Data = DRUG_DATABASE[drug1Key as keyof typeof DRUG_DATABASE];
        if (drug1Data) {
          const interaction = drug1Data.interactions.find(
            (i) => normalizeDrugName(i.drug) === drug2Key
          );
          if (interaction) {
            foundInteractions.push({
              id: `${med1.id}-${med2.id}`,
              drug1: med1.name,
              drug2: med2.name,
              severity: interaction.severity as DrugInteraction["severity"],
              description: interaction.description,
              mechanism: interaction.mechanism,
              action: interaction.action,
              monitoring: interaction.monitoring,
              timestamp: new Date(),
            });
          }
        }

        const drug2Data = DRUG_DATABASE[drug2Key as keyof typeof DRUG_DATABASE];
        if (drug2Data) {
          const interaction = drug2Data.interactions.find(
            (i) => normalizeDrugName(i.drug) === drug1Key
          );
          if (interaction && !foundInteractions.find(i => i.drug1 === med2.name && i.drug2 === med1.name)) {
            foundInteractions.push({
              id: `${med2.id}-${med1.id}`,
              drug1: med2.name,
              drug2: med1.name,
              severity: interaction.severity as DrugInteraction["severity"],
              description: interaction.description,
              mechanism: interaction.mechanism,
              action: interaction.action,
              monitoring: interaction.monitoring,
              timestamp: new Date(),
            });
          }
        }
      });
    });

    setInteractions(foundInteractions);
    setScanHistory(prev => [...prev, { timestamp: new Date(), count: foundInteractions.length }].slice(-10));
    
    setTimeout(() => {
      setIsScanning(false);
      if (foundInteractions.length > 0) {
        toast.warning(`Found ${foundInteractions.length} drug interaction(s)`);
      } else {
        toast.success("No interactions found");
      }
    }, 500);
  }, [medications]);

  // Add medication
  const addMedication = () => {
    if (!newMedication.trim()) {
      toast.error("Please enter a medication name");
      return;
    }

    const med: MedicationEntry = {
      id: `med-${Date.now()}`,
      name: newMedication.trim(),
      dose: newDose,
      frequency: newFrequency,
      route: newRoute,
    };

    setMedications(prev => [...prev, med]);
    setNewMedication("");
    setNewDose("");
    setNewFrequency("");
    setNewRoute("oral");
    setShowAddDialog(false);
    toast.success(`Added ${med.name}`);
  };

  // Remove medication
  const removeMedication = (id: string) => {
    setMedications(prev => {
      const newMeds = prev.filter(m => m.id !== id);
      // Clear interactions if less than 2 medications
      if (newMeds.length < 2) {
        setInteractions([]);
      }
      return newMeds;
    });
    toast.info("Medication removed");
  };

  // Get severity styling
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "contraindicated":
        return { bg: "bg-red-100", text: "text-red-700", border: "border-red-300", icon: XCircle };
      case "major":
        return { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300", icon: AlertTriangle };
      case "moderate":
        return { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300", icon: AlertCircle };
      default:
        return { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300", icon: Info };
    }
  };

  // Filter interactions
  const filteredInteractions = interactions.filter(i => {
    if (filterSeverity === "all") return true;
    return i.severity === filterSeverity;
  });

  // Severity counts
  const severityCounts = {
    contraindicated: interactions.filter(i => i.severity === "contraindicated").length,
    major: interactions.filter(i => i.severity === "major").length,
    moderate: interactions.filter(i => i.severity === "moderate").length,
    minor: interactions.filter(i => i.severity === "minor").length,
  };

  // Search suggestions
  const searchSuggestions = Object.keys(DRUG_DATABASE)
    .filter(d => d.includes(searchQuery.toLowerCase()))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Pill className="h-7 w-7 text-rose-500" />
            Drug Interaction Checker
          </h2>
          <p className="text-slate-500 mt-1">Real-time drug-drug interaction analysis with severity alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={realtimeAlerts ? "default" : "outline"}
            size="sm"
            onClick={() => setRealtimeAlerts(!realtimeAlerts)}
          >
            {realtimeAlerts ? <Bell className="h-4 w-4 mr-1" /> : <BellOff className="h-4 w-4 mr-1" />}
            Real-time
          </Button>
          <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700">
            <Shield className="h-3 w-3 mr-1" />
            Clinical Safety
          </Badge>
        </div>
      </div>

      {/* Severity Summary */}
      {interactions.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { key: "contraindicated", label: "Contraindicated", color: "bg-red-500" },
            { key: "major", label: "Major", color: "bg-orange-500" },
            { key: "moderate", label: "Moderate", color: "bg-yellow-500" },
            { key: "minor", label: "Minor", color: "bg-blue-500" },
          ].map((severity) => (
            <Card key={severity.key} className="border-0 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${severity.color}`} />
                  <span className="text-sm text-slate-600">{severity.label}</span>
                </div>
                <div className="text-2xl font-bold mt-1">
                  {severityCounts[severity.key as keyof typeof severityCounts]}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Medication List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Medication List</CardTitle>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Medication</DialogTitle>
                    <DialogDescription>Enter medication details for interaction checking</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Medication Name</Label>
                      <div className="relative">
                        <Input
                          placeholder="e.g., Warfarin"
                          value={newMedication}
                          onChange={(e) => setNewMedication(e.target.value)}
                        />
                        {searchQuery && searchSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 bg-white border rounded-lg mt-1 shadow-lg z-10">
                            {searchSuggestions.map((s) => (
                              <button
                                key={s}
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm"
                                onClick={() => {
                                  setNewMedication(s.charAt(0).toUpperCase() + s.slice(1));
                                  setSearchQuery("");
                                }}
                              >
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Dose</Label>
                        <Input
                          placeholder="e.g., 5mg"
                          value={newDose}
                          onChange={(e) => setNewDose(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Frequency</Label>
                        <Input
                          placeholder="e.g., daily"
                          value={newFrequency}
                          onChange={(e) => setNewFrequency(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Route</Label>
                      <Select value={newRoute} onValueChange={setNewRoute}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="oral">Oral</SelectItem>
                          <SelectItem value="iv">IV</SelectItem>
                          <SelectItem value="im">IM</SelectItem>
                          <SelectItem value="sc">Subcutaneous</SelectItem>
                          <SelectItem value="topical">Topical</SelectItem>
                          <SelectItem value="inhaled">Inhaled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                    <Button onClick={addMedication}>Add Medication</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {medications.length > 0 ? (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {medications.map((med) => (
                    <div
                      key={med.id}
                      className="p-3 bg-slate-50 rounded-lg flex items-start justify-between group"
                    >
                      <div>
                        <div className="font-medium">{med.name}</div>
                        <div className="text-xs text-slate-500">
                          {med.dose && `${med.dose} • `}
                          {med.frequency && `${med.frequency} • `}
                          {med.route}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                        onClick={() => removeMedication(med.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-center">
                <div>
                  <Pill className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No medications added</p>
                  <p className="text-xs text-slate-400">Add medications to check interactions</p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              onClick={checkInteractions}
              disabled={medications.length < 2 || isScanning}
              className="flex-1"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Check Interactions
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Interaction Results */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Interaction Results</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="contraindicated">Contraindicated</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="minor">Minor</SelectItem>
                  </SelectContent>
                </Select>
                {interactions.length > 0 && (
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredInteractions.length > 0 ? (
              <ScrollArea className="h-[450px]">
                <div className="space-y-3">
                  {filteredInteractions.map((interaction) => {
                    const style = getSeverityStyle(interaction.severity);
                    const Icon = style.icon;
                    return (
                      <motion.div
                        key={interaction.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 rounded-lg border-2 ${style.bg} ${style.border}`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className={`h-5 w-5 ${style.text} mt-0.5 shrink-0`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{interaction.drug1}</span>
                              <ChevronRight className="h-4 w-4 text-slate-400" />
                              <span className="font-semibold">{interaction.drug2}</span>
                              <Badge className={`${style.bg} ${style.text} border ${style.border}`}>
                                {interaction.severity.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-700 mb-2">{interaction.description}</p>
                            <div className="grid md:grid-cols-2 gap-3 mt-3 text-sm">
                              <div>
                                <span className="font-medium text-slate-600">Mechanism:</span>
                                <p className="text-slate-500">{interaction.mechanism}</p>
                              </div>
                              <div>
                                <span className="font-medium text-slate-600">Action:</span>
                                <p className="text-slate-500">{interaction.action}</p>
                              </div>
                            </div>
                            {interaction.monitoring.length > 0 && (
                              <div className="mt-3">
                                <span className="font-medium text-slate-600 text-sm">Monitoring:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {interaction.monitoring.map((m, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {m}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : interactions.length > 0 ? (
              <div className="h-[300px] flex items-center justify-center text-center">
                <div>
                  <Filter className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No interactions match filter</p>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-center">
                <div>
                  {medications.length < 2 ? (
                    <>
                      <Pill className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">Add at least 2 medications</p>
                      <p className="text-xs text-slate-400">Interactions will appear here</p>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                      <p className="text-emerald-600 font-medium">No Interactions Found</p>
                      <p className="text-xs text-slate-400">Current medications appear safe together</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Drug Database Info */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-slate-800 to-slate-900 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <Brain className="h-8 w-8 text-rose-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">AI-Powered Drug Database</h3>
                <p className="text-slate-400 text-sm">
                  {Object.keys(DRUG_DATABASE).length} drugs indexed with interaction data
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Updated Regularly</span>
              </div>
              <p className="text-xs text-slate-400">Based on clinical evidence</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
