const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../lib/api.ts');
const content = `
// ─── Vendor Registration ──────────────────────────────────────────────────
export async function submitVendorRegistration(formData: FormData): Promise<{ success: boolean; message: string; data?: any }> {
    try {
        const res = await fetch(\`\${API_URL}/api/vendors/register\`, {
            method: 'POST',
            body: formData,
        });
        const json = await res.json();
        if (!res.ok) {
            throw new Error(json.message || 'Failed to submit registration');
        }
        return json;
    } catch (error: any) {
        console.error('Error submitting vendor registration:', error);
        return { success: false, message: error.message };
    }
}
`;
fs.appendFileSync(filePath, content, 'utf8');
