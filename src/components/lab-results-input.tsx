"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  TestTube,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface LabTest {
  name: string;
  code: string;
  unit: string;
  range: string;
  category: string;
}

interface LabResult {
  id: string;
  testName: string;
  testCode?: string;
  category: string;
  resultValue: string;
  unit?: string;
  referenceRange?: string;
  interpretation: string;
  orderedDate: string;
  resultDate?: string;
  aiInterpretation?: string;
  aiAlertFlag: boolean;
}

interface LabResultsInputProps {
  patientId: string;
  consultationId?: string;
  onResultsChange?: (results: LabResult[]) => void;
}

const categories = [
  { value: "blood", label: "Blood Test" },
  { value: "urine", label: "Urinalysis" },
  { value: "imaging", label: "Imaging" },
  { value: "pathology", label: "Pathology" },
  { value: "microbiology", label: "Microbiology" },
  { value: "cardiac", label: "Cardiac" },
  { value: "other", label: "Other" },
];

export function LabResultsInput({ patientId, consultationId, onResultsChange }: LabResultsInputProps) {
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isNewLabOpen, setIsNewLabOpen] = useState(false);
  const [labTestSuggestions, setLabTestSuggestions] = useState<LabTest[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSearchingTests, setIsSearchingTests] = useState(false);
  const { toast } = useToast();
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const [newLab, setNewLab] = useState({
    testName: "",
    testCode: "",
    category: "blood",
    resultValue: "",
    unit: "",
    referenceRange: "",
    interpretation: "pending" as const,
  });

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

  // Search lab tests
  const searchLabTests = useCallback(async (query: string) => {
    if (query.length < 2) {
      setLabTestSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearchingTests(true);
    try {
      const response = await fetch(`/api/ai-suggestions/lab-tests?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.success) {
        setLabTestSuggestions(data.data);
        setShowSuggestions(data.data.length > 0);
        setSelectedIndex(-1);
      }
    } catch (error) {
      console.error("Error searching lab tests:", error);
    } finally {
      setIsSearchingTests(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (newLab.testName) {
        searchLabTests(newLab.testName);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [newLab.testName, searchLabTests]);

  // Handle selecting a lab test suggestion
  const selectLabTest = (test: LabTest) => {
    setNewLab({
      ...newLab,
      testName: test.name,
      testCode: test.code,
      unit: test.unit,
      referenceRange: test.range,
      category: test.category.toLowerCase(),
    });
    setShowSuggestions(false);
    setLabTestSuggestions([]);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && labTestSuggestions.length > 0) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < labTestSuggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : labTestSuggestions.length - 1
          );
          break;
        case "Tab":
        case "Enter":
          if (selectedIndex >= 0) {
            e.preventDefault();
            selectLabTest(labTestSuggestions[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setShowSuggestions(false);
          break;
      }
    }
  };

  // Create new lab result
  const handleCreateLabResult = async () => {
    if (!newLab.testName || !newLab.resultValue) {
      toast({
        title: "Error",
        description: "Test name and result value are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/lab-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          consultationId,
          testName: newLab.testName,
          testCode: newLab.testCode,
          category: newLab.category,
          resultValue: newLab.resultValue,
          unit: newLab.unit,
          referenceRange: newLab.referenceRange,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Lab result added successfully",
        });
        setNewLab({
          testName: "",
          testCode: "",
          category: "blood",
          resultValue: "",
          unit: "",
          referenceRange: "",
          interpretation: "pending",
        });
        setIsNewLabOpen(false);
        fetchLabResults();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add lab result",
        variant: "destructive",
      });
    }
  };

  // Get interpretation badge
  const getInterpretationBadge = (interpretation: string, isAbnormal: boolean) => {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Beaker className="h-5 w-5 text-emerald-500" />
          <h3 className="text-lg font-semibold">Laboratory Results</h3>
          <Badge variant="secondary" className="text-xs">
            {labResults.length} results
          </Badge>
        </div>
        
        <Dialog open={isNewLabOpen} onOpenChange={setIsNewLabOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
              <Plus className="h-4 w-4 mr-1" />
              Add Lab Result
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5 text-emerald-500" />
                Add Lab Result
              </DialogTitle>
              <DialogDescription>
                Enter laboratory test results with AI-assisted test name suggestions
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Test Name with Autocomplete */}
              <div className="space-y-2">
                <Label>Test Name *</Label>
                <div className="relative">
                  <Input
                    ref={inputRef}
                    placeholder="Start typing test name... (e.g., Hemoglobin, CBC)"
                    value={newLab.testName}
                    onChange={(e) => setNewLab({ ...newLab, testName: e.target.value })}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                      if (labTestSuggestions.length > 0) setShowSuggestions(true);
                    }}
                  />
                  {isSearchingTests && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    </div>
                  )}
                  
                  {/* Lab Test Suggestions Dropdown */}
                  <AnimatePresence>
                    {showSuggestions && labTestSuggestions.length > 0 && (
                      <motion.div
                        ref={suggestionsRef}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 w-full mt-1 bg-white rounded-lg border border-slate-200 shadow-lg max-h-[200px] overflow-y-auto"
                      >
                        {labTestSuggestions.map((test, index) => (
                          <div
                            key={test.code}
                            onClick={() => selectLabTest(test)}
                            className={cn(
                              "flex items-center justify-between px-3 py-2 cursor-pointer transition-colors",
                              index === selectedIndex
                                ? "bg-emerald-50 border-l-2 border-emerald-500"
                                : "hover:bg-slate-50"
                            )}
                          >
                            <div>
                              <p className="text-sm font-medium">{test.name}</p>
                              <p className="text-xs text-slate-500">
                                {test.code} • {test.category}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-600">{test.range}</p>
                              <p className="text-xs text-slate-400">{test.unit}</p>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <p className="text-xs text-slate-400">
                  <Activity className="h-3 w-3 inline mr-1" />
                  AI-assisted autocomplete • Use ↑↓ to navigate, Tab to select
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Test Code</Label>
                  <Input
                    placeholder="e.g., HGB"
                    value={newLab.testCode}
                    onChange={(e) => setNewLab({ ...newLab, testCode: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newLab.category}
                    onValueChange={(value) => setNewLab({ ...newLab, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 col-span-1">
                  <Label>Result Value *</Label>
                  <Input
                    placeholder="e.g., 14.5"
                    value={newLab.resultValue}
                    onChange={(e) => setNewLab({ ...newLab, resultValue: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-1">
                  <Label>Unit</Label>
                  <Input
                    placeholder="e.g., g/dL"
                    value={newLab.unit}
                    onChange={(e) => setNewLab({ ...newLab, unit: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-1">
                  <Label>Reference Range</Label>
                  <Input
                    placeholder="e.g., 12-16"
                    value={newLab.referenceRange}
                    onChange={(e) => setNewLab({ ...newLab, referenceRange: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewLabOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-gradient-to-r from-emerald-500 to-teal-500"
                onClick={handleCreateLabResult}
                disabled={!newLab.testName || !newLab.resultValue}
              >
                Add Result
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lab Results List */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : labResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-center">
              <Beaker className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-slate-500">No lab results recorded</p>
              <p className="text-sm text-slate-400">Click "Add Lab Result" to enter results</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="divide-y divide-slate-100">
                {labResults.map((result, index) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "p-3 hover:bg-slate-50 transition-colors",
                      result.aiAlertFlag && "bg-amber-50/50"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-800">{result.testName}</span>
                          {result.testCode && (
                            <Badge variant="outline" className="text-xs">
                              {result.testCode}
                            </Badge>
                          )}
                          {getInterpretationBadge(result.interpretation, result.aiAlertFlag)}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-medium text-slate-700">
                            {result.resultValue} {result.unit}
                          </span>
                          {result.referenceRange && (
                            <span className="text-slate-500">
                              Ref: {result.referenceRange}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(result.orderedDate).toLocaleDateString()}
                          {result.category && ` • ${result.category}`}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Quick Add Common Labs */}
      <Card className="border-0 shadow-sm bg-slate-50">
        <CardContent className="p-3">
          <p className="text-xs text-slate-500 mb-2">Quick Add Common Tests:</p>
          <div className="flex flex-wrap gap-2">
            {["CBC", "CMP", "Lipid Panel", "TSH", "HbA1c", "PT/INR"].map((test) => (
              <Button
                key={test}
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setNewLab({ ...newLab, testName: test });
                  setIsNewLabOpen(true);
                }}
              >
                + {test}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
