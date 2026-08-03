import os

file_path = r'c:\Users\Harshit Frostrek\Desktop\VEDASHI\Storefront-Vedashi\lib\api.ts'
with open(file_path, 'a', encoding='utf-8') as f:
    f.write('''
// ─── Vendor Registration ──────────────────────────────────────────────────
export async function submitVendorRegistration(formData: FormData): Promise<{ success: boolean; message: string; data?: any }> {
    try {
        const res = await fetch(`${API_URL}/api/vendors/register`, {
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
''')
