'use client';

import { useState } from 'react';
import { Send, Building2, User, Mail, Phone, Globe, MapPin, FileText, Package, ChevronDown, UploadCloud, Info, CheckSquare, Award, BadgeCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { motion } from 'framer-motion';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const BUSINESS_TYPES = ['Manufacturer', 'Distributor', 'D2C Brand', 'Startup'];

const PRODUCT_CATEGORIES = [
  'Herbal Wellness', 'Natural Beauty', 'Spices', 'Dry Fruits', 'Foods', 'Teas', 'Other'
];

const CERTIFICATIONS_LIST = ['FSSAI', 'GMP', 'ISO', 'Organic', 'APEDA', 'Ayush', 'Other'];

const EXPORT_EXPERIENCE_OPTIONS = ['Yes', 'No'];

interface VendorForm {
  // Basic Information
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  city: string;
  state: string;

  // Business Details
  registrationNumber: string;
  businessAddress: string;
  businessType: string;
  yearsInOperation: string;

  // Product Information
  productCategory: string;
  numberOfSKUs: string;
  productDescription: string;
  productCatalog: File | null;

  // Certifications
  certificationsHeld: string[];
  certificationsFile: File | null;

  // Export Readiness
  exportExperience: string;
  countriesExportedTo: string;
  moq: string;

  // Additional Information
  websiteUrl: string;
  socialHandle: string;
  howDidYouHear: string;
  additionalComments: string;

  // Agreement
  agreeTerms: boolean;
  consentContact: boolean;
}

const INITIAL_FORM_STATE: VendorForm = {
  fullName: '',
  companyName: '',
  email: '',
  phone: '',
  city: '',
  state: '',
  registrationNumber: '',
  businessAddress: '',
  businessType: '',
  yearsInOperation: '',
  productCategory: '',
  numberOfSKUs: '',
  productDescription: '',
  productCatalog: null,
  certificationsHeld: [],
  certificationsFile: null,
  exportExperience: '',
  countriesExportedTo: '',
  moq: '',
  websiteUrl: '',
  socialHandle: '',
  howDidYouHear: '',
  additionalComments: '',
  agreeTerms: false,
  consentContact: false,
};

export default function VendorRegistrationPage() {
  const [form, setForm] = useState<VendorForm>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof VendorForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleCertification = (cert: string) => {
    setForm(prev => {
      const exists = prev.certificationsHeld.includes(cert);
      if (exists) {
        return { ...prev, certificationsHeld: prev.certificationsHeld.filter(c => c !== cert) };
      }
      return { ...prev, certificationsHeld: [...prev.certificationsHeld, cert] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.agreeTerms) {
      toast.error('You must agree to the Vendor Terms & Conditions');
      return;
    }

    setIsSubmitting(true);

    // Frontend-only for now — simulate submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success('Thank you! Your vendor registration has been submitted. Our team will get in touch soon.');
    setIsSubmitting(false);
    // Reset form
    setForm(INITIAL_FORM_STATE);

    // Also reset file inputs visually if needed (though uncontrolled by React standard, safe enough for this demo)
    const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
    fileInputs.forEach(input => { input.value = ''; });
  };

  const inputClass = "w-full rounded-[10px] border border-gray-200 px-4 py-3.5 text-[15px] placeholder:text-gray-400 focus:border-[#5F6F52] focus:ring-1 focus:ring-[#5F6F52] focus:outline-none transition-all shadow-sm bg-white";
  const selectClass = "w-full rounded-[10px] border border-gray-200 px-4 py-3.5 text-[15px] text-gray-700 focus:border-[#5F6F52] focus:ring-1 focus:ring-[#5F6F52] focus:outline-none transition-all shadow-sm bg-white appearance-none cursor-pointer";
  const labelClass = "block text-[11px] font-bold uppercase tracking-wider text-[#1A1A1A] mb-1.5";
  const textareaClass = "w-full rounded-[10px] border border-gray-200 px-4 py-3.5 text-[15px] placeholder:text-gray-400 focus:border-[#5F6F52] focus:ring-1 focus:ring-[#5F6F52] focus:outline-none transition-all shadow-sm bg-white min-h-[120px] resize-y";

  return (
    <div className="relative min-h-screen bg-white overflow-hidden selection:bg-[#5F6F52] selection:text-white pb-16">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
        style={{ willChange: "transform, opacity" }}
        className="relative z-10 pt-10 pb-4 sm:pt-14 sm:pb-6 text-left px-4 max-w-[1240px] mx-auto sm:px-6 lg:px-8"
      >
        <h1 className="text-[36px] leading-tight sm:text-5xl font-bold text-[#1A1A1A] mb-3 tracking-tight">
          Partner with Vedashi
        </h1>
        <p className="text-[#1A1A1A] text-sm sm:text-lg leading-relaxed font-medium">
          Take your products global. We handle export, compliance, and marketplace operations, you focus on growth.
        </p>
        <p className="text-[#5F6F52] text-xs mt-4 font-semibold tracking-wide">
          Fields marked with <span className="text-red-500">*</span> are mandatory.
        </p>
      </motion.section>

      {/* Form Section */}
      <div className="relative z-10 mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 gap-y-10 flex flex-col">
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          style={{ willChange: "transform, opacity" }}
          className="rounded-[24px] bg-white p-6 sm:p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col gap-12"
        >
          {/* 1. BASIC INFORMATION */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f5f2]">
                <User className="h-4 w-4 text-[#5F6F52]" strokeWidth={2} />
              </div>
              <h2 className="text-2xl font-bold text-[#1A1A1A]">Basic Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              <div>
                <label className={labelClass}>Full Name / Contact Person <span className="text-red-500">*</span></label>
                <input type="text" value={form.fullName} onChange={e => updateField('fullName', e.target.value)} className={inputClass} placeholder="Enter Full Name" required disabled={isSubmitting} />
              </div>
              <div>
                <label className={labelClass}>Company / Brand Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.companyName} onChange={e => updateField('companyName', e.target.value)} className={inputClass} placeholder="Enter Company / Brand Name" required disabled={isSubmitting} />
              </div>
              <div>
                <label className={labelClass}>Email Address <span className="text-red-500">*</span></label>
                <input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} className={inputClass} placeholder="Enter Email Address" required disabled={isSubmitting} />
              </div>
              <div>
                <label className={labelClass}>Phone Number <span className="text-red-500">*</span></label>
                <input type="tel" value={form.phone} onChange={e => updateField('phone', e.target.value)} className={inputClass} placeholder="Enter Phone Number" required disabled={isSubmitting} />
              </div>
              <div>
                <label className={labelClass}>City <span className="text-red-500">*</span></label>
                <input type="text" value={form.city} onChange={e => updateField('city', e.target.value)} className={inputClass} placeholder="Enter City" required disabled={isSubmitting} />
              </div>
              <div className="relative">
                <label className={labelClass}>State <span className="text-red-500">*</span></label>
                <select value={form.state} onChange={e => updateField('state', e.target.value)} className={selectClass} required disabled={isSubmitting}>
                  <option value="" disabled>Select State</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-[38px] h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* 2. BUSINESS DETAILS */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f5f2]">
                <Building2 className="h-4 w-4 text-[#5F6F52]" strokeWidth={2} />
              </div>
              <h2 className="text-2xl font-bold text-[#1A1A1A]">Business Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              <div>
                <label className={labelClass}>Business Registration / GST No. <span className="text-red-500">*</span></label>
                <input type="text" value={form.registrationNumber} onChange={e => updateField('registrationNumber', e.target.value)} className={inputClass} placeholder="Enter Registration or GST Number" required disabled={isSubmitting} />
              </div>
              <div className="relative">
                <label className={labelClass}>Type of Business <span className="text-red-500">*</span></label>
                <select value={form.businessType} onChange={e => updateField('businessType', e.target.value)} className={selectClass} required disabled={isSubmitting}>
                  <option value="" disabled>Select Business Type</option>
                  {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-[38px] h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Business Address <span className="text-red-500">*</span></label>
                <input type="text" value={form.businessAddress} onChange={e => updateField('businessAddress', e.target.value)} className={inputClass} placeholder="Enter Full Business Address" required disabled={isSubmitting} />
              </div>
              <div>
                <label className={labelClass}>Years in Operation <span className="text-red-500">*</span></label>
                <input type="number" min="0" value={form.yearsInOperation} onChange={e => updateField('yearsInOperation', e.target.value)} className={inputClass} placeholder="E.g., 5" required disabled={isSubmitting} />
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* 3. PRODUCT INFORMATION */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f5f2]">
                <Package className="h-4 w-4 text-[#5F6F52]" strokeWidth={2} />
              </div>
              <h2 className="text-2xl font-bold text-[#1A1A1A]">Product Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              <div className="relative">
                <label className={labelClass}>Product Category <span className="text-red-500">*</span></label>
                <select value={form.productCategory} onChange={e => updateField('productCategory', e.target.value)} className={selectClass} required disabled={isSubmitting}>
                  <option value="" disabled>Select Category</option>
                  {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-[38px] h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              <div>
                <label className={labelClass}>Number of SKUs <span className="text-red-500">*</span></label>
                <input type="number" min="1" value={form.numberOfSKUs} onChange={e => updateField('numberOfSKUs', e.target.value)} className={inputClass} placeholder="E.g., 20" required disabled={isSubmitting} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Brief Product Description <span className="text-red-500">*</span></label>
                <textarea value={form.productDescription} onChange={e => updateField('productDescription', e.target.value)} className={textareaClass} placeholder="Describe your products..." required disabled={isSubmitting} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Product Catalog (PDF / ZIP) <span className="text-gray-400 normal-case font-normal">(Optional)</span></label>
                <div className="mt-1 flex justify-center rounded-xl border border-dashed border-gray-300 px-6 py-8 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="text-center">
                    <UploadCloud className="mx-auto h-8 w-8 text-gray-400" />
                    <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                      <label htmlFor="product-catalog" className="relative cursor-pointer rounded-md bg-transparent font-semibold text-[#5F6F52] focus-within:outline-none hover:underline">
                        <span>Upload a file</span>
                        <input id="product-catalog" name="product-catalog" type="file" className="sr-only" accept=".pdf,.zip" disabled={isSubmitting} onChange={(e) => updateField('productCatalog', e.target.files?.[0])} />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs leading-5 text-gray-500 mt-2">
                      {form.productCatalog ? form.productCatalog.name : "PDF or ZIP up to 10MB"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* 4. CERTIFICATIONS */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f5f2]">
                <BadgeCheck className="h-4 w-4 text-[#5F6F52]" strokeWidth={2} />
              </div>
              <h2 className="text-2xl font-bold text-[#1A1A1A]">Certifications</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="md:col-span-2">
                <label className="block text-[13px] font-bold text-[#1A1A1A] mb-3">Certifications Held</label>
                <div className="flex flex-wrap gap-3">
                  {CERTIFICATIONS_LIST.map((cert) => (
                    <label key={cert} className="inline-flex items-center gap-2 cursor-pointer bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 hover:border-[#5F6F52] transition-colors has-[:checked]:bg-[#f4f5f2] has-[:checked]:border-[#5F6F52] has-[:checked]:text-[#00472f]">
                      <input
                        type="checkbox"
                        checked={form.certificationsHeld.includes(cert)}
                        onChange={() => toggleCertification(cert)}
                        className="w-4 h-4 text-[#5F6F52] border-gray-300 rounded focus:ring-[#5F6F52]"
                        disabled={isSubmitting}
                      />
                      <span className="text-sm font-medium">{cert}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Upload Certificates (PDF / ZIP) <span className="text-gray-400 normal-case font-normal">(Optional)</span></label>
                <div className="mt-1 flex justify-center rounded-xl border border-dashed border-gray-300 px-6 py-6 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="text-center">
                    <div className="flex text-sm leading-6 text-gray-600 justify-center">
                      <label htmlFor="certifications-file" className="relative cursor-pointer rounded-md bg-transparent font-semibold text-[#5F6F52] focus-within:outline-none hover:underline">
                        <span>Upload file</span>
                        <input id="certifications-file" name="certifications-file" type="file" className="sr-only" accept=".pdf,.zip" disabled={isSubmitting} onChange={(e) => updateField('certificationsFile', e.target.files?.[0])} />
                      </label>
                    </div>
                    <p className="text-xs leading-5 text-gray-500 mt-1">
                      {form.certificationsFile ? form.certificationsFile.name : "Combine multiple into one file if necessary"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* 5. EXPORT READINESS */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f5f2]">
                <Globe className="h-4 w-4 text-[#5F6F52]" strokeWidth={2} />
              </div>
              <h2 className="text-2xl font-bold text-[#1A1A1A]">Export Readiness</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              <div className="relative">
                <label className={labelClass}>Previous Export Experience <span className="text-red-500">*</span></label>
                <select value={form.exportExperience} onChange={e => updateField('exportExperience', e.target.value)} className={selectClass} required disabled={isSubmitting}>
                  <option value="" disabled>Select</option>
                  {EXPORT_EXPERIENCE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-[38px] h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              <div>
                <label className={labelClass}>Minimum Order Quantity <span className="text-red-500">*</span></label>
                <input type="text" value={form.moq} onChange={e => updateField('moq', e.target.value)} className={inputClass} placeholder="E.g., 100 units / $500" required disabled={isSubmitting} />
              </div>
              {form.exportExperience === 'Yes' && (
                <div className="md:col-span-2">
                  <label className={labelClass}>Countries Previously Exported To</label>
                  <input type="text" value={form.countriesExportedTo} onChange={e => updateField('countriesExportedTo', e.target.value)} className={inputClass} placeholder="E.g., USA, UAE, UK" disabled={isSubmitting} />
                </div>
              )}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* 6. ADDITIONAL INFORMATION */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f5f2]">
                <Info className="h-4 w-4 text-[#5F6F52]" strokeWidth={2} />
              </div>
              <h2 className="text-2xl font-bold text-[#1A1A1A]">Additional Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              <div>
                <label className={labelClass}>Website URL</label>
                <input type="url" value={form.websiteUrl} onChange={e => updateField('websiteUrl', e.target.value)} className={inputClass} placeholder="https://" disabled={isSubmitting} />
              </div>
              <div>
                <label className={labelClass}>Instagram / LinkedIn Handle</label>
                <input type="text" value={form.socialHandle} onChange={e => updateField('socialHandle', e.target.value)} className={inputClass} placeholder="@yourbusiness" disabled={isSubmitting} />
              </div>
              <div className="relative md:col-span-2">
                <label className={labelClass}>How Did You Hear About Vedashi?</label>
                <input type="text" value={form.howDidYouHear} onChange={e => updateField('howDidYouHear', e.target.value)} className={inputClass} placeholder="E.g., Google, LinkedIn, Referral..." disabled={isSubmitting} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Additional Comments</label>
                <textarea value={form.additionalComments} onChange={e => updateField('additionalComments', e.target.value)} className={textareaClass} placeholder="Any other details you'd like to share..." disabled={isSubmitting} />
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* 7. AGREEMENT */}
          <div>
            <div className="flex flex-col gap-4">
              <label className="flex items-start gap-4 cursor-pointer group">
                <div className="mt-0.5 border-2 border-gray-300 rounded-md w-5 h-5 flex items-center justify-center bg-white group-has-[input:checked]:bg-[#5F6F52] group-has-[input:checked]:border-[#5F6F52] transition-colors shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={form.agreeTerms}
                    onChange={(e) => updateField('agreeTerms', e.target.checked)}
                    required
                    disabled={isSubmitting}
                  />
                  <CheckSquare className={`w-3.5 h-3.5 text-white ${form.agreeTerms ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
                </div>
                <span className="text-[15px] text-gray-700 font-medium">I agree to the Vendor Terms & Conditions <span className="text-red-500">*</span></span>
              </label>

              <label className="flex items-start gap-4 cursor-pointer group">
                <div className="mt-0.5 border-2 border-gray-300 rounded-md w-5 h-5 flex items-center justify-center bg-white group-has-[input:checked]:bg-[#5F6F52] group-has-[input:checked]:border-[#5F6F52] transition-colors shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={form.consentContact}
                    onChange={(e) => updateField('consentContact', e.target.checked)}
                    disabled={isSubmitting}
                  />
                  <CheckSquare className={`w-3.5 h-3.5 text-white ${form.consentContact ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
                </div>
                <span className="text-[15px] text-gray-700 font-medium">I consent to Vedashi contacting me regarding partnership opportunities</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex justify-center">
            <motion.button
              whileHover={{ scale: isSubmitting ? 1 : 1.02, y: isSubmitting ? 0 : -2 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl bg-[#91C934] px-12 py-4 text-[16px] font-semibold text-white hover:bg-[#003822] transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(0,71,47,0.25)] hover:shadow-[0_8px_24px_rgba(0,71,47,0.35)]"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Registration'}
              <Send className={`h-5 w-5 ${isSubmitting ? 'animate-pulse' : ''}`} />
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
