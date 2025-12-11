import { GoogleGenAI, FunctionDeclaration, Tool, Type, Chat, GenerateContentResponse } from "@google/genai";
import { AgentType } from '../types';

const apiKey = process.env.API_KEY || '';

// Define the 4 sub-agents as tools
const patientManagementTool: FunctionDeclaration = {
  name: AgentType.PATIENT_MGMT,
  description: "Manages patient registration, demographics updates, and patient status (admitted, discharged).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING, description: "The action to perform (e.g., register, update_status, get_info)" },
      details: { type: Type.STRING, description: "Details of the patient or change required" }
    },
    required: ["action", "details"]
  }
};

const appointmentSchedulerTool: FunctionDeclaration = {
  name: AgentType.SCHEDULER,
  description: "Handles booking, modifying, canceling appointments, and checking schedule availability.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING, description: "book, cancel, reschedule, check_availability" },
      date: { type: Type.STRING, description: "Date and time of appointment" },
      doctor: { type: Type.STRING, description: "Name of the doctor or department" },
      patientId: { type: Type.STRING, description: "Patient identifier" }
    },
    required: ["action"]
  }
};

const medicalRecordsTool: FunctionDeclaration = {
  name: AgentType.RECORDS,
  description: "Retrieves, summarizes, or updates patient medical history, diagnosis, and prescriptions.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      patientId: { type: Type.STRING, description: "Patient identifier" },
      requestType: { type: Type.STRING, description: "summary, diagnosis, prescription, lab_result" }
    },
    required: ["patientId", "requestType"]
  }
};

const billingTool: FunctionDeclaration = {
  name: AgentType.BILLING,
  description: "Manages financial transactions, billing details, insurance claims, and invoices.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      patientId: { type: Type.STRING, description: "Patient identifier" },
      action: { type: Type.STRING, description: "generate_invoice, check_balance, process_payment" }
    },
    required: ["patientId", "action"]
  }
};

const tools: Tool[] = [{
  functionDeclarations: [
    patientManagementTool,
    appointmentSchedulerTool,
    medicalRecordsTool,
    billingTool
  ]
}];

let chatSession: Chat | null = null;
let genAI: GoogleGenAI | null = null;

export const initializeGemini = () => {
  if (!apiKey) {
    console.error("API Key is missing");
    return;
  }
  try {
    genAI = new GoogleGenAI({ apiKey });
    
    chatSession = genAI.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `You are the 'Koordinator_Sistem_Rumah_Sakit' (Hospital System Coordinator). 
        Your goal is to receive user requests and ROUTE them to the correct sub-agent using the provided tools.
        
        Rules:
        1. Always analyze the user's intent carefully.
        2. You MUST call one of the 4 provided tools/functions to handle the request. Do not answer directly without calling a tool if the request falls into a category.
        3. If the user greets you, introduce yourself as the Hospital Coordinator and ask how you can help.
        4. After the tool executes, you will receive the result. Summarize it professionally for the user.
        `,
        tools: tools,
      }
    });
  } catch (e) {
    console.error("Failed to initialize Gemini", e);
  }
};

export const sendMessageToGemini = async (
  message: string, 
  onToolActive?: (toolName: string) => void
): Promise<{ text: string, toolCall?: { name: string, args: any } }> => {
  if (!chatSession) {
    initializeGemini();
    if (!chatSession) return { text: "System Error: AI not initialized. Check API Key." };
  }

  try {
    let result: GenerateContentResponse = await chatSession.sendMessage({ message });
    
    // Check for tool calls
    const functionCalls = result.candidates?.[0]?.content?.parts?.[0]?.functionCall;
    
    if (functionCalls) {
      const toolName = functionCalls.name;
      const toolArgs = functionCalls.args;

      // Trigger callback for UI visualization
      if (onToolActive) {
        onToolActive(toolName);
      }

      // Simulate the backend processing of the tool
      const toolResponseString = simulateToolExecution(toolName, toolArgs);

      // Send the tool response back to Gemini to get the final natural language answer
      result = await chatSession.sendMessage({
        content: [
          {
            part: {
              functionResponse: {
                name: toolName,
                response: { result: toolResponseString }
              }
            }
          }
        ]
      });

      return {
        text: result.text || "Processed request successfully.",
        toolCall: { name: toolName, args: toolArgs }
      };
    }

    return { text: result.text || "I didn't understand that." };

  } catch (error) {
    console.error("Gemini Error:", error);
    return { text: "Sorry, I encountered an error processing your request." };
  }
};

// Mock Backend Logic
const simulateToolExecution = (name: string, args: any): string => {
  // Simulate delay for realism
  const now = new Date().toISOString();
  
  switch (name) {
    case AgentType.PATIENT_MGMT:
      return `SUCCESS: Patient Management System processed: ${JSON.stringify(args)}. Patient ID: P-${Math.floor(Math.random() * 1000)}`;
    case AgentType.SCHEDULER:
      return `SUCCESS: Appointment System confirmed: ${JSON.stringify(args)}. Slot confirmed for ${args.date || 'Requested Date'}. Reference: APT-${Math.floor(Math.random() * 9999)}`;
    case AgentType.RECORDS:
      return `SUCCESS: Medical Records Retrieved for ${JSON.stringify(args)}. Data: [Diagnosis: Healthy, Last Visit: ${now}]`;
    case AgentType.BILLING:
      return `SUCCESS: Billing System processed: ${JSON.stringify(args)}. Invoice generated #${Math.floor(Math.random() * 100000)} amount: IDR 500,000.`;
    default:
      return "Unknown tool execution.";
  }
};