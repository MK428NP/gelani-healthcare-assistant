"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Beaker,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  Loader2,
  ChevronDown,
  ChevronRight,
  TestTube,
  Activity,
  Droplets,
  Heart,
  Brain,
  Bone,
  Microscope,
  Filter,
  Save,
  FileText,
  Printer,
  ArrowUpDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Comprehensive Lab Test Database
const labTestDatabase = {
  haematology: {
    name: "Haematology",
    icon: Droplets,
    color: "text-red-500",
    bgColor: "bg-red-50",
    tests: [
      // Complete Blood Count
      { name: "Hemoglobin (Hb)", code: "HGB", unit: "g/dL", maleRange: "13.5-17.5", femaleRange: "12.0-16.0", sample: "Whole Blood EDTA", category: "CBC" },
      { name: "Hematocrit (Hct)", code: "HCT", unit: "%", maleRange: "40-54", femaleRange: "36-48", sample: "Whole Blood EDTA", category: "CBC" },
      { name: "Red Blood Cell Count", code: "RBC", unit: "x10^6/µL", maleRange: "4.5-5.9", femaleRange: "4.0-5.2", sample: "Whole Blood EDTA", category: "CBC" },
      { name: "White Blood Cell Count", code: "WBC", unit: "x10^3/µL", maleRange: "4.5-11.0", femaleRange: "4.5-11.0", sample: "Whole Blood EDTA", category: "CBC" },
      { name: "Platelet Count", code: "PLT", unit: "x10^3/µL", maleRange: "150-400", femaleRange: "150-400", sample: "Whole Blood EDTA", category: "CBC" },
      { name: "MCV (Mean Corpuscular Volume)", code: "MCV", unit: "fL", maleRange: "80-100", femaleRange: "80-100", sample: "Whole Blood EDTA", category: "CBC" },
      { name: "MCH (Mean Corpuscular Hb)", code: "MCH", unit: "pg", maleRange: "27-33", femaleRange: "27-33", sample: "Whole Blood EDTA", category: "CBC" },
      { name: "MCHC (Mean Corpuscular Hb Conc)", code: "MCHC", unit: "g/dL", maleRange: "32-36", femaleRange: "32-36", sample: "Whole Blood EDTA", category: "CBC" },
      { name: "RDW (Red Cell Distribution Width)", code: "RDW", unit: "%", maleRange: "11.5-14.5", femaleRange: "11.5-14.5", sample: "Whole Blood EDTA", category: "CBC" },
      // WBC Differential
      { name: "Neutrophils", code: "NEUT", unit: "%", maleRange: "40-75", femaleRange: "40-75", sample: "Whole Blood EDTA", category: "Differential" },
      { name: "Neutrophil Count", code: "NEUT#", unit: "x10^3/µL", maleRange: "1.8-7.5", femaleRange: "1.8-7.5", sample: "Whole Blood EDTA", category: "Differential" },
      { name: "Lymphocytes", code: "LYMPH", unit: "%", maleRange: "20-45", femaleRange: "20-45", sample: "Whole Blood EDTA", category: "Differential" },
      { name: "Lymphocyte Count", code: "LYMPH#", unit: "x10^3/µL", maleRange: "1.0-4.0", femaleRange: "1.0-4.0", sample: "Whole Blood EDTA", category: "Differential" },
      { name: "Monocytes", code: "MONO", unit: "%", maleRange: "2-10", femaleRange: "2-10", sample: "Whole Blood EDTA", category: "Differential" },
      { name: "Monocyte Count", code: "MONO#", unit: "x10^3/µL", maleRange: "0.2-0.8", femaleRange: "0.2-0.8", sample: "Whole Blood EDTA", category: "Differential" },
      { name: "Eosinophils", code: "EOS", unit: "%", maleRange: "0-6", femaleRange: "0-6", sample: "Whole Blood EDTA", category: "Differential" },
      { name: "Eosinophil Count", code: "EOS#", unit: "x10^3/µL", maleRange: "0-0.5", femaleRange: "0-0.5", sample: "Whole Blood EDTA", category: "Differential" },
      { name: "Basophils", code: "BASO", unit: "%", maleRange: "0-2", femaleRange: "0-2", sample: "Whole Blood EDTA", category: "Differential" },
      { name: "Basophil Count", code: "BASO#", unit: "x10^3/µL", maleRange: "0-0.2", femaleRange: "0-0.2", sample: "Whole Blood EDTA", category: "Differential" },
      // Coagulation
      { name: "Prothrombin Time (PT)", code: "PT", unit: "seconds", maleRange: "11-13.5", femaleRange: "11-13.5", sample: "Sodium Citrate", category: "Coagulation" },
      { name: "INR (International Normalized Ratio)", code: "INR", unit: "", maleRange: "0.9-1.2", femaleRange: "0.9-1.2", sample: "Sodium Citrate", category: "Coagulation" },
      { name: "PTT (Partial Thromboplastin Time)", code: "PTT", unit: "seconds", maleRange: "25-35", femaleRange: "25-35", sample: "Sodium Citrate", category: "Coagulation" },
      { name: "APTT (Activated PTT)", code: "APTT", unit: "seconds", maleRange: "30-40", femaleRange: "30-40", sample: "Sodium Citrate", category: "Coagulation" },
      { name: "D-Dimer", code: "DDIMER", unit: "ng/mL", maleRange: "<500", femaleRange: "<500", sample: "Sodium Citrate", category: "Coagulation" },
      { name: "Fibrinogen", code: "FIB", unit: "mg/dL", maleRange: "200-400", femaleRange: "200-400", sample: "Sodium Citrate", category: "Coagulation" },
      { name: "Bleeding Time", code: "BT", unit: "minutes", maleRange: "1-7", femaleRange: "1-7", sample: "Skin Puncture", category: "Coagulation" },
      { name: "Clotting Time", code: "CT", unit: "minutes", maleRange: "4-10", femaleRange: "4-10", sample: "Whole Blood", category: "Coagulation" },
      // Special Haematology
      { name: "Reticulocyte Count", code: "RETIC", unit: "%", maleRange: "0.5-2.5", femaleRange: "0.5-2.5", sample: "Whole Blood EDTA", category: "Special" },
      { name: "ESR (Erythrocyte Sedimentation Rate)", code: "ESR", unit: "mm/hr", maleRange: "0-15", femaleRange: "0-20", sample: "Whole Blood EDTA", category: "Special" },
      { name: "Peripheral Blood Smear", code: "PBS", unit: "", maleRange: "", femaleRange: "", sample: "Whole Blood EDTA", category: "Special" },
      { name: "Sickle Cell Test", code: "SICKLE", unit: "", maleRange: "Negative", femaleRange: "Negative", sample: "Whole Blood EDTA", category: "Special" },
      { name: "G6PD Screening", code: "G6PD", unit: "U/g Hb", maleRange: "4.6-13.5", femaleRange: "4.6-13.5", sample: "Whole Blood EDTA", category: "Special" },
      { name: "Blood Group", code: "BG", unit: "", maleRange: "", femaleRange: "", sample: "Whole Blood EDTA", category: "Special" },
      { name: "Rh Typing", code: "RH", unit: "", maleRange: "", femaleRange: "", sample: "Whole Blood EDTA", category: "Special" },
    ],
  },
  chemistry: {
    name: "Clinical Chemistry",
    icon: TestTube,
    color: "text-amber-500",
    bgColor: "bg-amber-50",
    tests: [
      // Renal Function
      { name: "Blood Urea Nitrogen (BUN)", code: "BUN", unit: "mg/dL", maleRange: "7-20", femaleRange: "7-20", sample: "Serum", category: "Renal Function" },
      { name: "Creatinine", code: "CREA", unit: "mg/dL", maleRange: "0.7-1.3", femaleRange: "0.6-1.1", sample: "Serum", category: "Renal Function" },
      { name: "BUN/Creatinine Ratio", code: "BUN/CR", unit: "", maleRange: "10-20", femaleRange: "10-20", sample: "Calculated", category: "Renal Function" },
      { name: "eGFR (Estimated GFR)", code: "eGFR", unit: "mL/min/1.73m²", maleRange: ">90", femaleRange: ">90", sample: "Calculated", category: "Renal Function" },
      { name: "Uric Acid", code: "URIC", unit: "mg/dL", maleRange: "3.5-7.2", femaleRange: "2.6-6.0", sample: "Serum", category: "Renal Function" },
      { name: "Cystatin C", code: "CYSC", unit: "mg/L", maleRange: "0.6-1.1", femaleRange: "0.6-1.1", sample: "Serum", category: "Renal Function" },
      // Electrolytes
      { name: "Sodium (Na)", code: "NA", unit: "mmol/L", maleRange: "136-145", femaleRange: "136-145", sample: "Serum", category: "Electrolytes" },
      { name: "Potassium (K)", code: "K", unit: "mmol/L", maleRange: "3.5-5.0", femaleRange: "3.5-5.0", sample: "Serum", category: "Electrolytes" },
      { name: "Chloride (Cl)", code: "CL", unit: "mmol/L", maleRange: "98-107", femaleRange: "98-107", sample: "Serum", category: "Electrolytes" },
      { name: "Bicarbonate (HCO3)", code: "HCO3", unit: "mmol/L", maleRange: "22-28", femaleRange: "22-28", sample: "Serum", category: "Electrolytes" },
      { name: "Anion Gap", code: "AG", unit: "mmol/L", maleRange: "8-16", femaleRange: "8-16", sample: "Calculated", category: "Electrolytes" },
      // Liver Function
      { name: "ALT (SGPT)", code: "ALT", unit: "U/L", maleRange: "7-56", femaleRange: "7-56", sample: "Serum", category: "Liver Function" },
      { name: "AST (SGOT)", code: "AST", unit: "U/L", maleRange: "10-40", femaleRange: "10-40", sample: "Serum", category: "Liver Function" },
      { name: "Alkaline Phosphatase (ALP)", code: "ALP", unit: "U/L", maleRange: "44-147", femaleRange: "44-147", sample: "Serum", category: "Liver Function" },
      { name: "Gamma GT (GGT)", code: "GGT", unit: "U/L", maleRange: "9-48", femaleRange: "7-32", sample: "Serum", category: "Liver Function" },
      { name: "Total Bilirubin", code: "TBIL", unit: "mg/dL", maleRange: "0.3-1.2", femaleRange: "0.3-1.2", sample: "Serum", category: "Liver Function" },
      { name: "Direct Bilirubin", code: "DBIL", unit: "mg/dL", maleRange: "0.0-0.3", femaleRange: "0.0-0.3", sample: "Serum", category: "Liver Function" },
      { name: "Indirect Bilirubin", code: "IBIL", unit: "mg/dL", maleRange: "0.2-0.8", femaleRange: "0.2-0.8", sample: "Calculated", category: "Liver Function" },
      { name: "Total Protein", code: "TP", unit: "g/dL", maleRange: "6.0-8.3", femaleRange: "6.0-8.3", sample: "Serum", category: "Liver Function" },
      { name: "Albumin", code: "ALB", unit: "g/dL", maleRange: "3.5-5.5", femaleRange: "3.5-5.5", sample: "Serum", category: "Liver Function" },
      { name: "Globulin", code: "GLOB", unit: "g/dL", maleRange: "2.0-3.5", femaleRange: "2.0-3.5", sample: "Calculated", category: "Liver Function" },
      { name: "A/G Ratio", code: "AGR", unit: "", maleRange: "1.0-2.2", femaleRange: "1.0-2.2", sample: "Calculated", category: "Liver Function" },
      // Cardiac Markers
      { name: "Troponin I", code: "TROP-I", unit: "ng/mL", maleRange: "<0.04", femaleRange: "<0.04", sample: "Serum", category: "Cardiac" },
      { name: "Troponin T", code: "TROP-T", unit: "ng/mL", maleRange: "<0.01", femaleRange: "<0.01", sample: "Serum", category: "Cardiac" },
      { name: "CK-MB", code: "CKMB", unit: "U/L", maleRange: "0-25", femaleRange: "0-25", sample: "Serum", category: "Cardiac" },
      { name: "CK Total (Creatine Kinase)", code: "CK", unit: "U/L", maleRange: "30-200", femaleRange: "30-150", sample: "Serum", category: "Cardiac" },
      { name: "BNP (B-type Natriuretic Peptide)", code: "BNP", unit: "pg/mL", maleRange: "<100", femaleRange: "<100", sample: "EDTA Plasma", category: "Cardiac" },
      { name: "NT-proBNP", code: "NTBNP", unit: "pg/mL", maleRange: "<300", femaleRange: "<300", sample: "EDTA Plasma", category: "Cardiac" },
      { name: "LDH (Lactate Dehydrogenase)", code: "LDH", unit: "U/L", maleRange: "140-280", femaleRange: "140-280", sample: "Serum", category: "Cardiac" },
      { name: "Myoglobin", code: "MYO", unit: "ng/mL", maleRange: "<90", femaleRange: "<90", sample: "Serum", category: "Cardiac" },
      // Lipid Profile
      { name: "Total Cholesterol", code: "CHOL", unit: "mg/dL", maleRange: "<200", femaleRange: "<200", sample: "Serum", category: "Lipid Profile" },
      { name: "HDL Cholesterol", code: "HDL", unit: "mg/dL", maleRange: ">40", femaleRange: ">50", sample: "Serum", category: "Lipid Profile" },
      { name: "LDL Cholesterol (Calculated)", code: "LDL", unit: "mg/dL", maleRange: "<100", femaleRange: "<100", sample: "Calculated", category: "Lipid Profile" },
      { name: "VLDL Cholesterol", code: "VLDL", unit: "mg/dL", maleRange: "5-40", femaleRange: "5-40", sample: "Calculated", category: "Lipid Profile" },
      { name: "Triglycerides", code: "TG", unit: "mg/dL", maleRange: "<150", femaleRange: "<150", sample: "Serum", category: "Lipid Profile" },
      { name: "Non-HDL Cholesterol", code: "NONHDL", unit: "mg/dL", maleRange: "<130", femaleRange: "<130", sample: "Calculated", category: "Lipid Profile" },
      { name: "Total Chol/HDL Ratio", code: "CHOL/HDL", unit: "", maleRange: "<5.0", femaleRange: "<4.5", sample: "Calculated", category: "Lipid Profile" },
      // Thyroid Function
      { name: "TSH (Thyroid Stimulating Hormone)", code: "TSH", unit: "mIU/L", maleRange: "0.4-4.0", femaleRange: "0.4-4.0", sample: "Serum", category: "Thyroid" },
      { name: "Free T4 (Thyroxine)", code: "FT4", unit: "ng/dL", maleRange: "0.8-1.8", femaleRange: "0.8-1.8", sample: "Serum", category: "Thyroid" },
      { name: "Free T3 (Triiodothyronine)", code: "FT3", unit: "pg/mL", maleRange: "2.3-4.2", femaleRange: "2.3-4.2", sample: "Serum", category: "Thyroid" },
      { name: "Total T4", code: "TT4", unit: "µg/dL", maleRange: "4.5-12.5", femaleRange: "4.5-12.5", sample: "Serum", category: "Thyroid" },
      { name: "Total T3", code: "TT3", unit: "ng/dL", maleRange: "80-200", femaleRange: "80-200", sample: "Serum", category: "Thyroid" },
      { name: "Anti-TPO (Thyroid Peroxidase Ab)", code: "ATPO", unit: "IU/mL", maleRange: "<35", femaleRange: "<35", sample: "Serum", category: "Thyroid" },
      { name: "Anti-Thyroglobulin Ab", code: "ATG", unit: "IU/mL", maleRange: "<40", femaleRange: "<40", sample: "Serum", category: "Thyroid" },
      // Diabetes
      { name: "Fasting Blood Glucose", code: "FBG", unit: "mg/dL", maleRange: "70-100", femaleRange: "70-100", sample: "Serum", category: "Diabetes" },
      { name: "Random Blood Glucose", code: "RBG", unit: "mg/dL", maleRange: "<140", femaleRange: "<140", sample: "Serum", category: "Diabetes" },
      { name: "HbA1c (Glycated Hemoglobin)", code: "HBA1C", unit: "%", maleRange: "4.0-5.6", femaleRange: "4.0-5.6", sample: "Whole Blood EDTA", category: "Diabetes" },
      { name: "Fructosamine", code: "FRUCT", unit: "µmol/L", maleRange: "200-285", femaleRange: "200-285", sample: "Serum", category: "Diabetes" },
      { name: "C-Peptide", code: "CPEP", unit: "ng/mL", maleRange: "0.8-3.1", femaleRange: "0.8-3.1", sample: "Serum", category: "Diabetes" },
      { name: "Insulin (Fasting)", code: "INS", unit: "µIU/mL", maleRange: "2.6-24.9", femaleRange: "2.6-24.9", sample: "Serum", category: "Diabetes" },
      // Minerals & Vitamins
      { name: "Calcium (Total)", code: "CA", unit: "mg/dL", maleRange: "8.5-10.5", femaleRange: "8.5-10.5", sample: "Serum", category: "Minerals" },
      { name: "Calcium (Ionized)", code: "CAI", unit: "mmol/L", maleRange: "1.12-1.32", femaleRange: "1.12-1.32", sample: "Serum", category: "Minerals" },
      { name: "Phosphorus", code: "PHOS", unit: "mg/dL", maleRange: "2.5-4.5", femaleRange: "2.5-4.5", sample: "Serum", category: "Minerals" },
      { name: "Magnesium", code: "MG", unit: "mg/dL", maleRange: "1.7-2.2", femaleRange: "1.7-2.2", sample: "Serum", category: "Minerals" },
      { name: "Iron", code: "FE", unit: "µg/dL", maleRange: "65-175", femaleRange: "50-170", sample: "Serum", category: "Minerals" },
      { name: "Ferritin", code: "FERR", unit: "ng/mL", maleRange: "20-250", femaleRange: "10-120", sample: "Serum", category: "Minerals" },
      { name: "TIBC (Total Iron Binding Capacity)", code: "TIBC", unit: "µg/dL", maleRange: "250-450", femaleRange: "250-450", sample: "Serum", category: "Minerals" },
      { name: "Transferrin Saturation", code: "TSAT", unit: "%", maleRange: "20-50", femaleRange: "20-50", sample: "Calculated", category: "Minerals" },
      { name: "Vitamin B12", code: "B12", unit: "pg/mL", maleRange: "200-900", femaleRange: "200-900", sample: "Serum", category: "Vitamins" },
      { name: "Folate (Folic Acid)", code: "FOLATE", unit: "ng/mL", maleRange: "3-17", femaleRange: "3-17", sample: "Serum", category: "Vitamins" },
      { name: "Vitamin D (25-OH)", code: "VITD", unit: "ng/mL", maleRange: "30-100", femaleRange: "30-100", sample: "Serum", category: "Vitamins" },
      { name: "Vitamin D (1,25-Dihydroxy)", code: "VITD125", unit: "pg/mL", maleRange: "18-78", femaleRange: "18-78", sample: "Serum", category: "Vitamins" },
      { name: "Zinc", code: "ZN", unit: "µg/dL", maleRange: "70-120", femaleRange: "70-120", sample: "Serum", category: "Minerals" },
      // Other Chemistry
      { name: "Amylase", code: "AMY", unit: "U/L", maleRange: "30-110", femaleRange: "30-110", sample: "Serum", category: "Other" },
      { name: "Lipase", code: "LIP", unit: "U/L", maleRange: "10-140", femaleRange: "10-140", sample: "Serum", category: "Other" },
      { name: "Lactate", code: "LAC", unit: "mmol/L", maleRange: "0.5-2.2", femaleRange: "0.5-2.2", sample: "Plasma", category: "Other" },
      { name: "Ammonia", code: "NH3", unit: "µmol/L", maleRange: "15-45", femaleRange: "15-45", sample: "Plasma", category: "Other" },
      { name: "CRP (C-Reactive Protein)", code: "CRP", unit: "mg/L", maleRange: "<10", femaleRange: "<10", sample: "Serum", category: "Other" },
      { name: "hs-CRP (High Sensitivity)", code: "HSCRP", unit: "mg/L", maleRange: "<3.0", femaleRange: "<3.0", sample: "Serum", category: "Other" },
    ],
  },
  immunology: {
    name: "Immunology/Serology",
    icon: Microscope,
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    tests: [
      // Infectious Disease
      { name: "HIV 1/2 Antibody", code: "HIV-AB", unit: "", maleRange: "Non-reactive", femaleRange: "Non-reactive", sample: "Serum", category: "Infectious Disease" },
      { name: "HIV P24 Antigen", code: "P24AG", unit: "", maleRange: "Non-reactive", femaleRange: "Non-reactive", sample: "Serum", category: "Infectious Disease" },
      { name: "HIV Viral Load", code: "HIV-VL", unit: "copies/mL", maleRange: "Not Detected", femaleRange: "Not Detected", sample: "Plasma", category: "Infectious Disease" },
      { name: "HIV CD4 Count", code: "CD4", unit: "cells/µL", maleRange: "500-1500", femaleRange: "500-1500", sample: "Whole Blood EDTA", category: "Infectious Disease" },
      { name: "HBsAg (Hepatitis B Surface Antigen)", code: "HBsAg", unit: "", maleRange: "Non-reactive", femaleRange: "Non-reactive", sample: "Serum", category: "Infectious Disease" },
      { name: "Anti-HBs (Hepatitis B Surface Ab)", code: "ANTI-HBS", unit: "mIU/mL", maleRange: ">10", femaleRange: ">10", sample: "Serum", category: "Infectious Disease" },
      { name: "Anti-HBc (Hepatitis B Core Ab)", code: "ANTI-HBC", unit: "", maleRange: "Non-reactive", femaleRange: "Non-reactive", sample: "Serum", category: "Infectious Disease" },
      { name: "HBeAg", code: "HBEAG", unit: "", maleRange: "Non-reactive", femaleRange: "Non-reactive", sample: "Serum", category: "Infectious Disease" },
      { name: "Anti-HBe", code: "ANTI-HBE", unit: "", maleRange: "Non-reactive", femaleRange: "Non-reactive", sample: "Serum", category: "Infectious Disease" },
      { name: "HBV DNA Viral Load", code: "HBV-VL", unit: "IU/mL", maleRange: "Not Detected", femaleRange: "Not Detected", sample: "Serum", category: "Infectious Disease" },
      { name: "Anti-HCV (Hepatitis C Antibody)", code: "ANTI-HCV", unit: "", maleRange: "Non-reactive", femaleRange: "Non-reactive", sample: "Serum", category: "Infectious Disease" },
      { name: "HCV RNA Viral Load", code: "HCV-VL", unit: "IU/mL", maleRange: "Not Detected", femaleRange: "Not Detected", sample: "Serum", category: "Infectious Disease" },
      { name: "Hepatitis A IgM", code: "HAV-IGM", unit: "", maleRange: "Non-reactive", femaleRange: "Non-reactive", sample: "Serum", category: "Infectious Disease" },
      { name: "Hepatitis A Total Ab", code: "HAV-TOT", unit: "", maleRange: "Non-reactive", femaleRange: "Non-reactive", sample: "Serum", category: "Infectious Disease" },
      { name: "RPR (Rapid Plasma Reagin)", code: "RPR", unit: "", maleRange: "Non-reactive", femaleRange: "Non-reactive", sample: "Serum", category: "Infectious Disease" },
      { name: "VDRL", code: "VDRL", unit: "", maleRange: "Non-reactive", femaleRange: "Non-reactive", sample: "Serum", category: "Infectious Disease" },
      { name: "TPHA (Treponema Pallidum)", code: "TPHA", unit: "", maleRange: "Non-reactive", femaleRange: "Non-reactive", sample: "Serum", category: "Infectious Disease" },
      { name: "Rubella IgG", code: "RUB-IGG", unit: "IU/mL", maleRange: ">10", femaleRange: ">10", sample: "Serum", category: "Infectious Disease" },
      { name: "Rubella IgM", code: "RUB-IGM", unit: "", maleRange: "Non-reactive", femaleRange: "Non-reactive", sample: "Serum", category: "Infectious Disease" },
      { name: "CMV IgG", code: "CMV-IGG", unit: "AU/mL", maleRange: "", femaleRange: "", sample: "Serum", category: "Infectious Disease" },
      { name: "CMV IgM", code: "CMV-IGM", unit: "", maleRange: "Non-reactive", femaleRange: "Non-reactive", sample: "Serum", category: "Infectious Disease" },
      { name: "EBV IgG (VCA)", code: "EBV-IGG", unit: "", maleRange: "", femaleRange: "", sample: "Serum", category: "Infectious Disease" },
      { name: "EBV IgM (VCA)", code: "EBV-IGM", unit: "", maleRange: "Non-reactive", femaleRange: "Non-reactive", sample: "Serum", category: "Infectious Disease" },
      { name: "HSV 1 IgG", code: "HSV1-IGG", unit: "", maleRange: "", femaleRange: "", sample: "Serum", category: "Infectious Disease" },
      { name: "HSV 2 IgG", code: "HSV2-IGG", unit: "", maleRange: "", femaleRange: "", sample: "Serum", category: "Infectious Disease" },
      { name: "Toxoplasma IgG", code: "TOXO-IGG", unit: "IU/mL", maleRange: "", femaleRange: "", sample: "Serum", category: "Infectious Disease" },
      { name: "Toxoplasma IgM", code: "TOXO-IGM", unit: "", maleRange: "Non-reactive", femaleRange: "Non-reactive", sample: "Serum", category: "Infectious Disease" },
      // Autoimmune
      { name: "ANA (Antinuclear Antibody)", code: "ANA", unit: "", maleRange: "Negative", femaleRange: "Negative", sample: "Serum", category: "Autoimmune" },
      { name: "Anti-dsDNA", code: "DS-DNA", unit: "IU/mL", maleRange: "<25", femaleRange: "<25", sample: "Serum", category: "Autoimmune" },
      { name: "Rheumatoid Factor (RF)", code: "RF", unit: "IU/mL", maleRange: "<15", femaleRange: "<15", sample: "Serum", category: "Autoimmune" },
      { name: "Anti-CCP", code: "CCP", unit: "U/mL", maleRange: "<20", femaleRange: "<20", sample: "Serum", category: "Autoimmune" },
      { name: "ANCA (C-ANCA, P-ANCA)", code: "ANCA", unit: "", maleRange: "Negative", femaleRange: "Negative", sample: "Serum", category: "Autoimmune" },
      { name: "Anti-Smith Ab", code: "ANTI-SM", unit: "", maleRange: "Negative", femaleRange: "Negative", sample: "Serum", category: "Autoimmune" },
      { name: "Anti-RNP Ab", code: "ANTI-RNP", unit: "", maleRange: "Negative", femaleRange: "Negative", sample: "Serum", category: "Autoimmune" },
      { name: "Anti-SSA (Ro) Ab", code: "ANTI-SSA", unit: "", maleRange: "Negative", femaleRange: "Negative", sample: "Serum", category: "Autoimmune" },
      { name: "Anti-SSB (La) Ab", code: "ANTI-SSB", unit: "", maleRange: "Negative", femaleRange: "Negative", sample: "Serum", category: "Autoimmune" },
      { name: "C3 Complement", code: "C3", unit: "mg/dL", maleRange: "90-180", femaleRange: "90-180", sample: "Serum", category: "Autoimmune" },
      { name: "C4 Complement", code: "C4", unit: "mg/dL", maleRange: "10-40", femaleRange: "10-40", sample: "Serum", category: "Autoimmune" },
      // Tumor Markers
      { name: "CEA (Carcinoembryonic Antigen)", code: "CEA", unit: "ng/mL", maleRange: "<5", femaleRange: "<5", sample: "Serum", category: "Tumor Markers" },
      { name: "AFP (Alpha-Fetoprotein)", code: "AFP", unit: "ng/mL", maleRange: "<10", femaleRange: "<10", sample: "Serum", category: "Tumor Markers" },
      { name: "CA-125", code: "CA125", unit: "U/mL", maleRange: "<35", femaleRange: "<35", sample: "Serum", category: "Tumor Markers" },
      { name: "CA-19-9", code: "CA199", unit: "U/mL", maleRange: "<37", femaleRange: "<37", sample: "Serum", category: "Tumor Markers" },
      { name: "CA-15-3", code: "CA153", unit: "U/mL", maleRange: "<30", femaleRange: "<30", sample: "Serum", category: "Tumor Markers" },
      { name: "PSA (Total)", code: "PSA", unit: "ng/mL", maleRange: "<4", femaleRange: "N/A", sample: "Serum", category: "Tumor Markers" },
      { name: "Free PSA", code: "FPSA", unit: "ng/mL", maleRange: "", femaleRange: "N/A", sample: "Serum", category: "Tumor Markers" },
      { name: "Beta-hCG", code: "BHCG", unit: "mIU/mL", maleRange: "<5", femaleRange: "<5", sample: "Serum", category: "Tumor Markers" },
      // Immunoglobulins
      { name: "IgG", code: "IGG", unit: "mg/dL", maleRange: "700-1600", femaleRange: "700-1600", sample: "Serum", category: "Immunoglobulins" },
      { name: "IgA", code: "IGA", unit: "mg/dL", maleRange: "70-400", femaleRange: "70-400", sample: "Serum", category: "Immunoglobulins" },
      { name: "IgM", code: "IGM", unit: "mg/dL", maleRange: "40-230", femaleRange: "40-230", sample: "Serum", category: "Immunoglobulins" },
      { name: "IgE", code: "IGE", unit: "IU/mL", maleRange: "0-100", femaleRange: "0-100", sample: "Serum", category: "Immunoglobulins" },
    ],
  },
  urinalysis: {
    name: "Urinalysis",
    icon: Droplets,
    color: "text-yellow-500",
    bgColor: "bg-yellow-50",
    tests: [
      // Physical Examination
      { name: "Urine Color", code: "UCOLOR", unit: "", maleRange: "Yellow", femaleRange: "Yellow", sample: "Urine", category: "Physical" },
      { name: "Urine Appearance", code: "UAPPEAR", unit: "", maleRange: "Clear", femaleRange: "Clear", sample: "Urine", category: "Physical" },
      { name: "Urine Specific Gravity", code: "USG", unit: "", maleRange: "1.005-1.030", femaleRange: "1.005-1.030", sample: "Urine", category: "Physical" },
      { name: "Urine pH", code: "UPH", unit: "", maleRange: "4.6-8.0", femaleRange: "4.6-8.0", sample: "Urine", category: "Physical" },
      // Chemical Examination
      { name: "Urine Protein", code: "UPROT", unit: "", maleRange: "Negative", femaleRange: "Negative", sample: "Urine", category: "Chemical" },
      { name: "Urine Glucose", code: "UGLU", unit: "", maleRange: "Negative", femaleRange: "Negative", sample: "Urine", category: "Chemical" },
      { name: "Urine Ketones", code: "UKET", unit: "", maleRange: "Negative", femaleRange: "Negative", sample: "Urine", category: "Chemical" },
      { name: "Urine Blood", code: "UBLD", unit: "", maleRange: "Negative", femaleRange: "Negative", sample: "Urine", category: "Chemical" },
      { name: "Urine Bilirubin", code: "UBIL", unit: "", maleRange: "Negative", femaleRange: "Negative", sample: "Urine", category: "Chemical" },
      { name: "Urine Urobilinogen", code: "URO", unit: "EU/dL", maleRange: "0.2-1.0", femaleRange: "0.2-1.0", sample: "Urine", category: "Chemical" },
      { name: "Urine Nitrite", code: "UNITR", unit: "", maleRange: "Negative", femaleRange: "Negative", sample: "Urine", category: "Chemical" },
      { name: "Urine Leukocyte Esterase", code: "ULEU", unit: "", maleRange: "Negative", femaleRange: "Negative", sample: "Urine", category: "Chemical" },
      // Microscopic
      { name: "Urine RBC", code: "URBC", unit: "/HPF", maleRange: "0-3", femaleRange: "0-3", sample: "Urine", category: "Microscopic" },
      { name: "Urine WBC", code: "UWBC", unit: "/HPF", maleRange: "0-5", femaleRange: "0-5", sample: "Urine", category: "Microscopic" },
      { name: "Urine Epithelial Cells", code: "UEPI", unit: "/HPF", maleRange: "0-5", femaleRange: "0-5", sample: "Urine", category: "Microscopic" },
      { name: "Urine Casts", code: "UCAST", unit: "/LPF", maleRange: "0-2 hyaline", femaleRange: "0-2 hyaline", sample: "Urine", category: "Microscopic" },
      { name: "Urine Crystals", code: "UCRYST", unit: "", maleRange: "None", femaleRange: "None", sample: "Urine", category: "Microscopic" },
      { name: "Urine Bacteria", code: "UBACT", unit: "", maleRange: "None", femaleRange: "None", sample: "Urine", category: "Microscopic" },
      // Other Urine Tests
      { name: "24hr Urine Protein", code: "UPROT24", unit: "mg/24hr", maleRange: "<150", femaleRange: "<150", sample: "24hr Urine", category: "Other" },
      { name: "24hr Urine Creatinine", code: "UCREA24", unit: "mg/24hr", maleRange: "800-2000", femaleRange: "600-1800", sample: "24hr Urine", category: "Other" },
      { name: "Urine Albumin/Creatinine Ratio", code: "UACR", unit: "mg/g", maleRange: "<30", femaleRange: "<30", sample: "Urine", category: "Other" },
      { name: "Urine Pregnancy Test", code: "UPT", unit: "", maleRange: "N/A", femaleRange: "Negative", sample: "Urine", category: "Other" },
      { name: "Urine Culture", code: "UC/S", unit: "", maleRange: "No growth", femaleRange: "No growth", sample: "Midstream Urine", category: "Other" },
    ],
  },
  microbiology: {
    name: "Microbiology",
    icon: Microscope,
    color: "text-green-500",
    bgColor: "bg-green-50",
    tests: [
      // Blood Culture
      { name: "Blood Culture", code: "BC/S", unit: "", maleRange: "No growth", femaleRange: "No growth", sample: "Blood", category: "Culture" },
      // TB Tests
      { name: "Sputum AFB (Acid Fast Bacilli)", code: "AFB", unit: "", maleRange: "Negative", femaleRange: "Negative", sample: "Sputum", category: "TB" },
      { name: "GeneXpert MTB/RIF", code: "GENEXPERT", unit: "", maleRange: "Not Detected", femaleRange: "Not Detected", sample: "Sputum", category: "TB" },
      { name: "TB Culture", code: "TB-C", unit: "", maleRange: "No growth", femaleRange: "No growth", sample: "Sputum", category: "TB" },
      { name: "Mantoux Test (PPD)", code: "PPD", unit: "mm", maleRange: "<10", femaleRange: "<10", sample: "Skin Test", category: "TB" },
      // Stool
      { name: "Stool Routine", code: "STOOL-R", unit: "", maleRange: "Normal", femaleRange: "Normal", sample: "Stool", category: "Stool" },
      { name: "Stool Occult Blood", code: "FOBT", unit: "", maleRange: "Negative", femaleRange: "Negative", sample: "Stool", category: "Stool" },
      { name: "Stool for Ova & Parasites", code: "STOOL-OP", unit: "", maleRange: "Negative", femaleRange: "Negative", sample: "Stool", category: "Stool" },
      { name: "Stool Culture", code: "STOOL-C", unit: "", maleRange: "No pathogens", femaleRange: "No pathogens", sample: "Stool", category: "Stool" },
      // Swab Cultures
      { name: "Throat Swab Culture", code: "THROAT-C", unit: "", maleRange: "Normal flora", femaleRange: "Normal flora", sample: "Throat Swab", category: "Swab" },
      { name: "Wound Swab Culture", code: "WOUND-C", unit: "", maleRange: "No growth", femaleRange: "No growth", sample: "Wound Swab", category: "Swab" },
      { name: "High Vaginal Swab Culture", code: "HVS", unit: "", maleRange: "N/A", femaleRange: "Normal flora", sample: "Vaginal Swab", category: "Swab" },
      { name: "Ear Swab Culture", code: "EAR-C", unit: "", maleRange: "No growth", femaleRange: "No growth", sample: "Ear Swab", category: "Swab" },
      { name: "Eye Swab Culture", code: "EYE-C", unit: "", maleRange: "No growth", femaleRange: "No growth", sample: "Eye Swab", category: "Swab" },
      { name: "Nasal Swab Culture", code: "NASAL-C", unit: "", maleRange: "Normal flora", femaleRange: "Normal flora", sample: "Nasal Swab", category: "Swab" },
      { name: "Urethral Swab Culture", code: "URETH-C", unit: "", maleRange: "No growth", femaleRange: "N/A", sample: "Urethral Swab", category: "Swab" },
      // Body Fluids
      { name: "CSF Analysis", code: "CSF", unit: "", maleRange: "", femaleRange: "", sample: "CSF", category: "Body Fluids" },
      { name: "CSF Cell Count", code: "CSF-CELL", unit: "/µL", maleRange: "0-5 WBC", femaleRange: "0-5 WBC", sample: "CSF", category: "Body Fluids" },
      { name: "CSF Protein", code: "CSF-PROT", unit: "mg/dL", maleRange: "15-45", femaleRange: "15-45", sample: "CSF", category: "Body Fluids" },
      { name: "CSF Glucose", code: "CSF-GLU", unit: "mg/dL", maleRange: "50-80", femaleRange: "50-80", sample: "CSF", category: "Body Fluids" },
      { name: "Pleural Fluid Analysis", code: "PF", unit: "", maleRange: "", femaleRange: "", sample: "Pleural Fluid", category: "Body Fluids" },
      { name: "Ascitic Fluid Analysis", code: "AF", unit: "", maleRange: "", femaleRange: "", sample: "Ascitic Fluid", category: "Body Fluids" },
      { name: "Synovial Fluid Analysis", code: "SF", unit: "", maleRange: "", femaleRange: "", sample: "Synovial Fluid", category: "Body Fluids" },
    ],
  },
  endocrinology: {
    name: "Endocrinology",
    icon: Brain,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50",
    tests: [
      // Adrenal
      { name: "Cortisol (Morning)", code: "CORT-AM", unit: "µg/dL", maleRange: "6-23", femaleRange: "6-23", sample: "Serum", category: "Adrenal" },
      { name: "Cortisol (Evening)", code: "CORT-PM", unit: "µg/dL", maleRange: "3-16", femaleRange: "3-16", sample: "Serum", category: "Adrenal" },
      { name: "ACTH", code: "ACTH", unit: "pg/mL", maleRange: "10-60", femaleRange: "10-60", sample: "Plasma", category: "Adrenal" },
      { name: "DHEA-S", code: "DHEAS", unit: "µg/dL", maleRange: "80-560", femaleRange: "35-430", sample: "Serum", category: "Adrenal" },
      { name: "17-OH Progesterone", code: "17OHP", unit: "ng/dL", maleRange: "30-200", femaleRange: "20-100", sample: "Serum", category: "Adrenal" },
      // Gonadal
      { name: "Testosterone (Total)", code: "TESTO", unit: "ng/dL", maleRange: "300-1000", femaleRange: "15-70", sample: "Serum", category: "Gonadal" },
      { name: "Testosterone (Free)", code: "FTESTO", unit: "pg/mL", maleRange: "50-210", femaleRange: "1.0-8.5", sample: "Serum", category: "Gonadal" },
      { name: "FSH", code: "FSH", unit: "mIU/mL", maleRange: "1.5-12.4", femaleRange: "Follicular: 3.5-12.5", sample: "Serum", category: "Gonadal" },
      { name: "LH", code: "LH", unit: "mIU/mL", maleRange: "1.7-8.6", femaleRange: "Follicular: 2.4-12.6", sample: "Serum", category: "Gonadal" },
      { name: "Estradiol (E2)", code: "E2", unit: "pg/mL", maleRange: "10-40", femaleRange: "Follicular: 30-120", sample: "Serum", category: "Gonadal" },
      { name: "Progesterone", code: "PROG", unit: "ng/mL", maleRange: "<0.5", femaleRange: "Luteal: 5-25", sample: "Serum", category: "Gonadal" },
      { name: "Prolactin", code: "PRL", unit: "ng/mL", maleRange: "3-15", femaleRange: "4-23", sample: "Serum", category: "Gonadal" },
      // Pituitary
      { name: "Growth Hormone", code: "GH", unit: "ng/mL", maleRange: "<5", femaleRange: "<10", sample: "Serum", category: "Pituitary" },
      { name: "IGF-1", code: "IGF1", unit: "ng/mL", maleRange: "115-350", femaleRange: "115-350", sample: "Serum", category: "Pituitary" },
      // Parathyroid
      { name: "PTH (Parathyroid Hormone)", code: "PTH", unit: "pg/mL", maleRange: "15-65", femaleRange: "15-65", sample: "Serum", category: "Parathyroid" },
      // Other
      { name: "Serum Osmolality", code: "OSM", unit: "mOsm/kg", maleRange: "275-295", femaleRange: "275-295", sample: "Serum", category: "Other" },
      { name: "Urine Osmolality", code: "UOSM", unit: "mOsm/kg", maleRange: "50-1200", femaleRange: "50-1200", sample: "Urine", category: "Other" },
    ],
  },
  pathology: {
    name: "Pathology/Histopathology",
    icon: Microscope,
    color: "text-pink-500",
    bgColor: "bg-pink-50",
    tests: [
      { name: "Biopsy - Small", code: "BIO-S", unit: "", maleRange: "", femaleRange: "", sample: "Tissue", category: "Histopathology" },
      { name: "Biopsy - Large", code: "BIO-L", unit: "", maleRange: "", femaleRange: "", sample: "Tissue", category: "Histopathology" },
      { name: "Excision Biopsy", code: "EXBIO", unit: "", maleRange: "", femaleRange: "", sample: "Tissue", category: "Histopathology" },
      { name: "Incision Biopsy", code: "INBIO", unit: "", maleRange: "", femaleRange: "", sample: "Tissue", category: "Histopathology" },
      { name: "Needle Biopsy", code: "NBIO", unit: "", maleRange: "", femaleRange: "", sample: "Tissue", category: "Histopathology" },
      { name: "Skin Biopsy", code: "SKINBIO", unit: "", maleRange: "", femaleRange: "", sample: "Skin", category: "Histopathology" },
      { name: "Fine Needle Aspiration (FNA)", code: "FNA", unit: "", maleRange: "", femaleRange: "", sample: "Aspirate", category: "Cytology" },
      { name: "Pap Smear", code: "PAP", unit: "", maleRange: "N/A", femaleRange: "Normal", sample: "Cervical", category: "Cytology" },
      { name: "Liquid Based Cytology", code: "LBC", unit: "", maleRange: "N/A", femaleRange: "Normal", sample: "Cervical", category: "Cytology" },
      { name: "Body Fluid Cytology", code: "BFC", unit: "", maleRange: "", femaleRange: "", sample: "Body Fluid", category: "Cytology" },
    ],
  },
};

// Common Lab Panels
const labPanels = {
  cbc: {
    name: "Complete Blood Count (CBC)",
    tests: ["HGB", "HCT", "RBC", "WBC", "PLT", "MCV", "MCH", "MCHC", "RDW", "NEUT", "LYMPH", "MONO", "EOS", "BASO"],
  },
  cmp: {
    name: "Comprehensive Metabolic Panel (CMP)",
    tests: ["NA", "K", "CL", "HCO3", "BUN", "CREA", "FBG", "CA", "ALB", "TP", "ALT", "AST", "ALP", "TBIL"],
  },
  bmp: {
    name: "Basic Metabolic Panel (BMP)",
    tests: ["NA", "K", "CL", "HCO3", "BUN", "CREA", "FBG", "CA"],
  },
  lipid: {
    name: "Lipid Profile",
    tests: ["CHOL", "HDL", "LDL", "TG", "VLDL", "CHOL/HDL"],
  },
  lft: {
    name: "Liver Function Test (LFT)",
    tests: ["ALT", "AST", "ALP", "GGT", "TBIL", "DBIL", "TP", "ALB"],
  },
  renal: {
    name: "Renal Function Panel",
    tests: ["BUN", "CREA", "NA", "K", "CL", "HCO3", "CA", "FBG", "TP", "ALB"],
  },
  thyroid: {
    name: "Thyroid Panel",
    tests: ["TSH", "FT4", "FT3"],
  },
  cardiac: {
    name: "Cardiac Panel",
    tests: ["TROP-I", "CKMB", "CK", "BNP"],
  },
  coag: {
    name: "Coagulation Panel",
    tests: ["PT", "INR", "PTT", "FIB"],
  },
  iron: {
    name: "Iron Studies",
    tests: ["FE", "FERR", "TIBC", "TSAT"],
  },
  hba1c: {
    name: "Diabetes Monitoring",
    tests: ["HBA1C", "FBG"],
  },
};

interface LabResult {
  id: string;
  testName: string;
  testCode?: string;
  category: string;
  subcategory?: string;
  resultValue: string;
  unit?: string;
  referenceRange?: string;
  interpretation: "normal" | "abnormal" | "critical" | "pending";
  notes?: string;
  orderedDate: string;
  resultDate?: string;
}

interface LabResultsInputProps {
  patientId: string;
  consultationId?: string;
  onResultsChange?: (results: LabResult[]) => void;
}

export function LabResultsInput({ patientId, consultationId, onResultsChange }: LabResultsInputProps) {
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [activeSubcategory, setActiveSubcategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["haematology"]));
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  // Fetch existing lab results
  const fetchLabResults = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ patientId });
      if (consultationId) params.append("consultationId", consultationId);
      
      const response = await fetch(`/api/lab-results?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setLabResults(data.data);
        onResultsChange?.(data.data);
      }
    } catch (error) {
      console.error("Error fetching lab results:", error);
    } finally {
      setIsLoading(false);
    }
  }, [patientId, consultationId, onResultsChange]);

  useEffect(() => {
    if (patientId) {
      fetchLabResults();
    }
  }, [patientId, fetchLabResults]);

  // Add test to results
  const addTest = (test: typeof labTestDatabase.haematology.tests[0], categoryName: string) => {
    const existingTest = labResults.find((r) => r.testCode === test.code);
    if (existingTest) {
      toast({
        title: "Already Added",
        description: `${test.name} is already in the results`,
        variant: "destructive",
      });
      return;
    }

    const newResult: LabResult = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      testName: test.name,
      testCode: test.code,
      category: categoryName,
      subcategory: test.category,
      resultValue: "",
      unit: test.unit,
      referenceRange: test.maleRange,
      interpretation: "pending",
      notes: "",
      orderedDate: new Date().toISOString(),
    };

    setLabResults([...labResults, newResult]);
    toast({
      title: "Test Added",
      description: `${test.name} added to results`,
    });
  };

  // Add entire panel
  const addPanel = (panelKey: keyof typeof labPanels) => {
    const panel = labPanels[panelKey];
    let addedCount = 0;

    panel.tests.forEach((code) => {
      const existingTest = labResults.find((r) => r.testCode === code);
      if (!existingTest) {
        // Find test in database
        for (const [catKey, category] of Object.entries(labTestDatabase)) {
          const test = category.tests.find((t) => t.code === code);
          if (test) {
            const newResult: LabResult = {
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${code}`,
              testName: test.name,
              testCode: test.code,
              category: category.name,
              subcategory: test.category,
              resultValue: "",
              unit: test.unit,
              referenceRange: test.maleRange,
              interpretation: "pending",
              notes: "",
              orderedDate: new Date().toISOString(),
            };
            setLabResults((prev) => [...prev, newResult]);
            addedCount++;
            break;
          }
        }
      }
    });

    if (addedCount > 0) {
      toast({
        title: "Panel Added",
        description: `${panel.name}: ${addedCount} tests added`,
      });
    } else {
      toast({
        title: "Already Added",
        description: "All tests from this panel already exist",
        variant: "destructive",
      });
    }
  };

  // Update result value
  const updateResult = (id: string, field: keyof LabResult, value: string) => {
    setLabResults(
      labResults.map((r) => {
        if (r.id === id) {
          const updated = { ...r, [field]: value };
          
          // Auto-determine interpretation based on reference range
          if (field === "resultValue" && r.referenceRange && value) {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              const range = r.referenceRange;
              // Parse range
              if (range.includes("-")) {
                const [min, max] = range.split("-").map((s) => parseFloat(s.trim()));
                if (!isNaN(min) && !isNaN(max)) {
                  if (numValue < min * 0.7 || numValue > max * 1.3) {
                    updated.interpretation = "critical";
                  } else if (numValue < min || numValue > max) {
                    updated.interpretation = "abnormal";
                  } else {
                    updated.interpretation = "normal";
                  }
                }
              } else if (range.startsWith("<")) {
                const threshold = parseFloat(range.substring(1));
                if (!isNaN(threshold)) {
                  updated.interpretation = numValue < threshold ? "normal" : "abnormal";
                }
              } else if (range.startsWith(">")) {
                const threshold = parseFloat(range.substring(1));
                if (!isNaN(threshold)) {
                  updated.interpretation = numValue > threshold ? "normal" : "abnormal";
                }
              }
            }
          }
          return updated;
        }
        return r;
      })
    );
  };

  // Remove result
  const removeResult = (id: string) => {
    setLabResults(labResults.filter((r) => r.id !== id));
  };

  // Clear all results
  const clearAll = () => {
    setLabResults([]);
    setNotes("");
  };

  // Save results
  const handleSaveResults = async () => {
    if (labResults.length === 0) {
      toast({
        title: "No Results",
        description: "Add at least one test result to save",
        variant: "destructive",
      });
      return;
    }

    const emptyResults = labResults.filter((r) => !r.resultValue);
    if (emptyResults.length > 0) {
      toast({
        title: "Missing Values",
        description: `${emptyResults.length} test(s) have no result value`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/lab-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          consultationId,
          results: labResults,
          notes,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Lab results saved successfully",
        });
        fetchLabResults();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save lab results",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get interpretation badge
  const getInterpretationBadge = (interpretation: string) => {
    switch (interpretation) {
      case "normal":
        return (
          <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Normal
          </Badge>
        );
      case "abnormal":
        return (
          <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Abnormal
          </Badge>
        );
      case "critical":
        return (
          <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700">
            <AlertCircle className="h-3 w-3 mr-1" />
            Critical
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  // Toggle category expansion
  const toggleCategory = (categoryKey: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryKey)) {
      newExpanded.delete(categoryKey);
    } else {
      newExpanded.add(categoryKey);
    }
    setExpandedCategories(newExpanded);
  };

  // Filter tests by search
  const getFilteredTests = () => {
    if (!searchQuery) return null;
    const results: { test: typeof labTestDatabase.haematology.tests[0]; category: string }[] = [];

    Object.entries(labTestDatabase).forEach(([catKey, category]) => {
      category.tests.forEach((test) => {
        if (
          test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          test.code.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          results.push({ test, category: category.name });
        }
      });
    });

    return results;
  };

  return (
    <div className="space-y-4">
      {/* Header with Quick Panels */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Beaker className="h-5 w-5 text-emerald-500" />
            <h3 className="text-lg font-semibold">Laboratory Results Entry</h3>
            <Badge variant="secondary" className="text-xs">
              {labResults.length} tests
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearAll} disabled={labResults.length === 0}>
              <Trash2 className="h-4 w-4 mr-1" />
              Clear All
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-teal-500"
              onClick={handleSaveResults}
              disabled={isLoading || labResults.length === 0}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Save Results
            </Button>
          </div>
        </div>

        {/* Quick Panel Buttons */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-slate-500 self-center">Quick Panels:</span>
          {Object.entries(labPanels).map(([key, panel]) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => addPanel(key as keyof typeof labPanels)}
            >
              <Plus className="h-3 w-3 mr-1" />
              {panel.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Test Selection Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search lab tests by name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Search Results */}
          {searchQuery && (
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Search Results</CardTitle>
                <CardDescription>{getFilteredTests()?.length || 0} test(s) found</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {getFilteredTests()?.map(({ test, category }, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-3 rounded-lg border bg-slate-50 hover:bg-slate-100 cursor-pointer"
                        onClick={() => addTest(test, category)}
                      >
                        <div>
                          <p className="font-medium text-sm">{test.name}</p>
                          <p className="text-xs text-slate-500">
                            {test.code} • {category}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-600">{test.maleRange}</p>
                          <p className="text-xs text-slate-400">{test.unit}</p>
                        </div>
                        <Plus className="h-4 w-4 text-emerald-500 ml-2" />
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Category Browsers */}
          {!searchQuery && (
            <ScrollArea className="h-[500px]">
              <div className="space-y-2 pr-4">
                {Object.entries(labTestDatabase).map(([catKey, category]) => {
                  const Icon = category.icon;
                  const isExpanded = expandedCategories.has(catKey);
                  const subcategories = [...new Set(category.tests.map((t) => t.category))];

                  return (
                    <Collapsible
                      key={catKey}
                      open={isExpanded}
                      onOpenChange={() => toggleCategory(catKey)}
                    >
                      <Card className="border-0 shadow-md">
                        <CollapsibleTrigger asChild>
                          <CardHeader className="py-3 cursor-pointer hover:bg-slate-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${category.bgColor}`}>
                                  <Icon className={`h-5 w-5 ${category.color}`} />
                                </div>
                                <div>
                                  <CardTitle className="text-base">{category.name}</CardTitle>
                                  <CardDescription>{category.tests.length} tests</CardDescription>
                                </div>
                              </div>
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5 text-slate-400" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-slate-400" />
                              )}
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="pt-0 pb-4">
                            {/* Subcategory Filter */}
                            <div className="flex gap-2 mb-3 flex-wrap">
                              <Button
                                variant={activeSubcategory === "" ? "default" : "outline"}
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => setActiveSubcategory("")}
                              >
                                All
                              </Button>
                              {subcategories.map((sub) => (
                                <Button
                                  key={sub}
                                  variant={activeSubcategory === sub ? "default" : "outline"}
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => setActiveSubcategory(sub)}
                                >
                                  {sub}
                                </Button>
                              ))}
                            </div>

                            {/* Tests Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {category.tests
                                .filter((t) => !activeSubcategory || t.category === activeSubcategory)
                                .map((test) => {
                                  const isAdded = labResults.some((r) => r.testCode === test.code);
                                  return (
                                    <div
                                      key={test.code}
                                      onClick={() => !isAdded && addTest(test, category.name)}
                                      className={`p-3 rounded-lg border transition-colors ${
                                        isAdded
                                          ? "bg-emerald-50 border-emerald-200 cursor-not-allowed"
                                          : "bg-slate-50 hover:bg-slate-100 cursor-pointer"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <p className="font-medium text-sm">{test.name}</p>
                                            {isAdded && (
                                              <Badge variant="outline" className="text-xs bg-emerald-100 border-emerald-200 text-emerald-700">
                                                Added
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                            <Badge variant="outline" className="text-xs">{test.code}</Badge>
                                            <span>{test.unit}</span>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-xs font-medium text-slate-700">{test.maleRange}</p>
                                          <p className="text-xs text-slate-400">Ref Range</p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Results Entry Panel */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-md sticky top-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Results Entry</CardTitle>
              <CardDescription>Enter values for selected tests</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {labResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center">
                    <TestTube className="h-12 w-12 text-slate-300 mb-4" />
                    <p className="text-slate-500">No tests selected</p>
                    <p className="text-xs text-slate-400 mt-1">Select tests from the left panel</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {labResults.map((result) => (
                        <motion.div
                          key={result.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className={`p-3 rounded-lg border ${
                            result.interpretation === "critical"
                              ? "bg-red-50 border-red-200"
                              : result.interpretation === "abnormal"
                              ? "bg-amber-50 border-amber-200"
                              : result.interpretation === "normal"
                              ? "bg-emerald-50 border-emerald-200"
                              : "bg-slate-50"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{result.testName}</p>
                              <p className="text-xs text-slate-500">{result.testCode} • {result.subcategory}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeResult(result.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Result *</Label>
                              <Input
                                placeholder="Value"
                                value={result.resultValue}
                                onChange={(e) => updateResult(result.id, "resultValue", e.target.value)}
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Unit</Label>
                              <Input
                                placeholder="Unit"
                                value={result.unit || ""}
                                onChange={(e) => updateResult(result.id, "unit", e.target.value)}
                                className="h-8"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Ref: {result.referenceRange}</span>
                            {getInterpretationBadge(result.interpretation)}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </ScrollArea>

              {labResults.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <Label className="text-xs">Notes</Label>
                    <Textarea
                      placeholder="Additional notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={clearAll}
                      >
                        Clear
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500"
                        onClick={handleSaveResults}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-1" />
                        )}
                        Save
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default LabResultsInput;
