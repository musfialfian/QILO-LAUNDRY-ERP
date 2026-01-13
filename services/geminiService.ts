import { GoogleGenAI } from "@google/genai";
import { FinancialReport, InventoryMaterial } from "../types";

export const analyzeFinancialData = async (report: FinancialReport, inventory: InventoryMaterial[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Analyze this laundry business financial and inventory data for multiple branches:
    Financial Summary:
    - Total Revenue: Rp${report.totalRevenue.toLocaleString()}
    - Total Expenses: Rp${report.totalExpenses.toLocaleString()}
    - Net Income: Rp${report.netIncome.toLocaleString()}
    
    Branch Performance:
    ${report.branchesPerformance.map(b => `- ${b.branchName}: Revenue Rp${b.revenue.toLocaleString()}, Expenses Rp${b.expenses.toLocaleString()}`).join('\n')}
    
    Inventory Alerts (Low Stock):
    ${inventory.filter(i => i.stock <= i.minStock).map(i => `- ${i.name} (Stock: ${i.stock} ${i.unit})`).join('\n')}
    
    Please provide:
    1. A brief executive summary of performance.
    2. Identification of the most profitable branch.
    3. Operational recommendations for cost saving.
    4. Urgent inventory actions.
    
    Keep the tone professional and helpful. Output in Indonesian.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return "Maaf, sistem analisis AI sedang tidak tersedia saat ini.";
  }
};