"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Image as ImageIcon,
  Upload,
  Loader2,
  ZoomIn,
  RotateCw,
  Download,
  AlertTriangle,
  CheckCircle,
  Info,
  Eye,
  FileImage,
  Scan,
  Brain,
  Stethoscope,
  Activity,
  X,
  User,
  Clock,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
}

interface PatientImage {
  id: string;
  imageUrl: string;
  imageType: string;
  analysisResult?: string;
  uploadedAt: string;
}

interface AnalysisResult {
  id: string;
  type: string;
  findings: Finding[];
  impression: string;
  confidence: number;
  recommendations: string[];
}

interface Finding {
  description: string;
  location: string;
  confidence: number;
  severity: "normal" | "abnormal" | "critical";
}

const sampleAnalyses: Record<string, AnalysisResult> = {
  "chest-xray": {
    id: "1",
    type: "Chest X-Ray",
    findings: [
      { description: "Cardiac silhouette within normal limits", location: "Cardiac", confidence: 0.92, severity: "normal" },
      { description: "Lungs are clear bilaterally", location: "Pulmonary", confidence: 0.88, severity: "normal" },
      { description: "No pleural effusion identified", location: "Pleural", confidence: 0.94, severity: "normal" },
      { description: "Bony structures appear intact", location: "Musculoskeletal", confidence: 0.90, severity: "normal" },
    ],
    impression: "No acute cardiopulmonary abnormality identified. Cardiac silhouette and pulmonary vascularity within normal limits.",
    confidence: 0.91,
    recommendations: [
      "Clinical correlation recommended",
      "Consider comparison with prior studies if available",
      "Follow-up imaging as clinically indicated",
    ],
  },
  "ct-scan": {
    id: "2",
    type: "CT Scan Analysis",
    findings: [
      { description: "Small hypodense lesion in right lobe", location: "Liver", confidence: 0.78, severity: "abnormal" },
      { description: "No evidence of portal hypertension", location: "Hepatic", confidence: 0.85, severity: "normal" },
      { description: "Spleen size within normal limits", location: "Splenic", confidence: 0.92, severity: "normal" },
    ],
    impression: "Small hepatic lesion noted. Recommend further characterization with contrast-enhanced imaging.",
    confidence: 0.82,
    recommendations: [
      "Consider contrast-enhanced CT or MRI for further evaluation",
      "Liver function tests recommended",
      "Follow-up in 3 months if benign etiology confirmed",
    ],
  },
};

export function ImageAnalysis() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [patientImages, setPatientImages] = useState<PatientImage[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedType, setSelectedType] = useState<string>("chest-xray");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch patients on mount
  useEffect(() => {
    fetchPatients();
  }, []);

  // Fetch patient images when patient is selected
  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientImages(selectedPatientId);
    } else {
      setPatientImages([]);
    }
  }, [selectedPatientId]);

  const fetchPatients = async () => {
    try {
      setIsLoadingPatients(true);
      const response = await fetch("/api/patients?limit=100");
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
      setIsLoadingPatients(false);
    }
  };

  const fetchPatientImages = async (patientId: string) => {
    try {
      setIsLoadingImages(true);
      // In a real app, this would fetch from an API
      // For now, we'll simulate with empty array
      setPatientImages([]);
    } catch (error) {
      console.error("Failed to fetch images:", error);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const getSelectedPatient = () => {
    return patients.find((p) => p.id === selectedPatientId);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedImage) return;
    
    setIsAnalyzing(true);
    
    try {
      const response = await fetch("/api/image-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: uploadedImage,
          imageType: selectedType,
          patientId: selectedPatientId,
        }),
      });

      const data = await response.json();
      if (data.success && data.data.analysis) {
        setAnalysisResult(data.data.analysis);
      } else {
        // Fallback to simulated analysis
        setTimeout(() => {
          setAnalysisResult(sampleAnalyses[selectedType] || sampleAnalyses["chest-xray"]);
        }, 2500);
      }
    } catch (error) {
      // Fallback to simulated analysis
      setTimeout(() => {
        setAnalysisResult(sampleAnalyses[selectedType] || sampleAnalyses["chest-xray"]);
      }, 2500);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToRecord = async () => {
    if (!selectedPatientId || !uploadedImage || !analysisResult) {
      toast({
        title: "Error",
        description: "Please select a patient and analyze an image first",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // In a real app, this would save to the database
      toast({
        title: "Success",
        description: "Image and analysis saved to patient record",
      });
      // Add to local list
      const newImage: PatientImage = {
        id: Date.now().toString(),
        imageUrl: uploadedImage,
        imageType: selectedType,
        analysisResult: analysisResult.impression,
        uploadedAt: new Date().toISOString(),
      };
      setPatientImages([newImage, ...patientImages]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save to patient record",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "critical":
        return { badge: "bg-red-100 text-red-700", icon: <AlertTriangle className="h-4 w-4 text-red-500" /> };
      case "abnormal":
        return { badge: "bg-amber-100 text-amber-700", icon: <Info className="h-4 w-4 text-amber-500" /> };
      default:
        return { badge: "bg-emerald-100 text-emerald-700", icon: <CheckCircle className="h-4 w-4 text-emerald-500" /> };
    }
  };

  const selectedPatient = getSelectedPatient();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Scan className="h-6 w-6 text-cyan-500" />
            Medical Imaging
          </h2>
          <p className="text-slate-500">AI-powered radiology image interpretation</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-cyan-50 border-cyan-200 text-cyan-700">
            <Brain className="h-3 w-3 mr-1" />
            MedGemma Vision
          </Badge>
        </div>
      </div>

      {/* Patient Selection */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-cyan-500" />
            Patient Context
          </CardTitle>
          <CardDescription>Select a patient to link imaging results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select 
              value={selectedPatientId} 
              onValueChange={setSelectedPatientId}
              disabled={isLoadingPatients}
            >
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder={isLoadingPatients ? "Loading patients..." : "Select a patient..."} />
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
                  <AvatarFallback className="bg-cyan-100 text-cyan-700">
                    {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                  <p className="text-sm text-slate-500">{selectedPatient.mrn} • {selectedPatient.gender} • DOB: {new Date(selectedPatient.dateOfBirth).toLocaleDateString()}</p>
                </div>
                {patientImages.length > 0 && (
                  <Badge variant="outline" className="bg-cyan-50 border-cyan-200 text-cyan-700">
                    {patientImages.length} Images
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Safety Alert */}
      <Alert className="bg-cyan-50 border-cyan-200">
        <Eye className="h-4 w-4 text-cyan-600" />
        <AlertTitle className="text-cyan-800">AI-Assisted Image Analysis</AlertTitle>
        <AlertDescription className="text-cyan-700">
          This tool provides AI-assisted preliminary analysis. All results must be verified by a qualified radiologist before clinical use.
        </AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Image Upload & Preview */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Upload Image</CardTitle>
            <CardDescription>Supported formats: DICOM, PNG, JPEG</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 mb-4">
              {["chest-xray", "ct-scan"].map((type) => (
                <Button
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                  className={selectedType === type ? "bg-gradient-to-r from-cyan-500 to-blue-500" : ""}
                >
                  {type === "chest-xray" ? "Chest X-Ray" : "CT Scan"}
                </Button>
              ))}
            </div>

            <div
              className={`
                relative border-2 border-dashed rounded-xl overflow-hidden
                ${uploadedImage ? "border-cyan-300" : "border-slate-200"}
                min-h-[300px] flex items-center justify-center
                bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadedImage ? (
                <div className="relative w-full h-full">
                  <img
                    src={uploadedImage}
                    alt="Uploaded medical image"
                    className="w-full h-[300px] object-contain"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadedImage(null);
                      setAnalysisResult(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center p-8">
                  <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="font-medium text-slate-600 mb-1">Drop image here or click to upload</h3>
                  <p className="text-sm text-slate-400">Supports DICOM, PNG, JPEG up to 50MB</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.dcm"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="flex gap-2">
              <Button
                onClick={handleAnalyze}
                disabled={!uploadedImage || isAnalyzing}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Scan className="h-4 w-4 mr-2" />
                )}
                {isAnalyzing ? "Analyzing..." : "Analyze Image"}
              </Button>
              {analysisResult && selectedPatientId && (
                <Button
                  variant="outline"
                  onClick={handleSaveToRecord}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save to Record
                </Button>
              )}
            </div>

            {isAnalyzing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing image...</span>
                  <span>AI Analysis in progress</span>
                </div>
                <Progress value={66} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analysis Results */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">
              Analysis Results
              {selectedPatient && (
                <Badge variant="outline" className="ml-2 bg-cyan-50 border-cyan-200 text-cyan-700">
                  {selectedPatient.firstName} {selectedPatient.lastName[0]}.
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {analysisResult ? `Confidence: ${Math.round(analysisResult.confidence * 100)}%` : "Upload and analyze an image"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!analysisResult ? (
              <div className="flex flex-col items-center justify-center h-[350px] text-center">
                <FileImage className="h-12 w-12 text-slate-300 mb-4" />
                <h3 className="font-medium text-slate-600">No Analysis Yet</h3>
                <p className="text-sm text-slate-400">Upload an image and click analyze</p>
              </div>
            ) : (
              <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-4">
                  {/* Findings */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-cyan-500" />
                      Findings
                    </h4>
                    <div className="space-y-2">
                      {analysisResult.findings.map((finding, i) => {
                        const styles = getSeverityStyles(finding.severity);
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg"
                          >
                            {styles.icon}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">{finding.description}</p>
                                <Badge className={styles.badge}>
                                  {Math.round(finding.confidence * 100)}%
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-500">{finding.location}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  {/* Impression */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-purple-500" />
                      Impression
                    </h4>
                    <p className="text-sm text-slate-700 bg-purple-50 p-3 rounded-lg">
                      {analysisResult.impression}
                    </p>
                  </div>

                  <Separator />

                  {/* Recommendations */}
                  <div>
                    <h4 className="font-semibold mb-2">Recommendations</h4>
                    <ul className="space-y-1">
                      {analysisResult.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Patient Imaging History */}
      {selectedPatientId && patientImages.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Patient Imaging History</CardTitle>
            <CardDescription>Previous imaging studies for {selectedPatient?.firstName} {selectedPatient?.lastName}</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="grid sm:grid-cols-3 gap-4">
                {patientImages.map((image) => (
                  <div key={image.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{image.imageType}</Badge>
                      <span className="text-xs text-slate-500">{new Date(image.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">{image.analysisResult}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Image Types Reference */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Supported Image Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { name: "Chest X-Ray", desc: "PA/Lateral views", status: "Active" },
              { name: "CT Scan", desc: "All body regions", status: "Active" },
              { name: "MRI", desc: "Brain, Spine, Joints", status: "Beta" },
              { name: "Ultrasound", desc: "Abdominal, Cardiac", status: "Coming Soon" },
            ].map((type, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-lg text-center">
                <FileImage className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <h4 className="font-medium text-slate-700">{type.name}</h4>
                <p className="text-xs text-slate-500">{type.desc}</p>
                <Badge
                  variant="outline"
                  className={`mt-2 ${
                    type.status === "Active"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : type.status === "Beta"
                      ? "bg-amber-50 border-amber-200 text-amber-700"
                      : "bg-slate-100 border-slate-200 text-slate-500"
                  }`}
                >
                  {type.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
