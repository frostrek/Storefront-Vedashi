'use client';

import { useState } from 'react';
import { Send, Building2, User, Mail, Phone, Globe, MapPin, FileText, Package, ChevronDown } from 'lucide-react';
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

const CATEGORIES = [
  'Ayurvedic Products', 'Herbal Supplements', 'Natural Beauty & Cosmetics',
  'Organic Foods', 'Spices & Masalas', 'Dry Fruits & Snacks',
  'Teas & Superfoods', 'Personal Care', 'Health & Wellness',
  'Essential Oils', 'Home & Living', 'Other',
];

const GST_TYPES = ['Regular', 'Composition', 'Unregistered', 'Exempted'];

interface VendorForm {
  companyName: string;
  website: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  telephone: string;
  state: string;
  city: string;
  location: string;
  companyAddress: string;
  pincode: string;
  // Product Details
  category: string;
  goodsServices: string;
  panCard: string;
  gstNo: string;
  gstRegistrationType: string;
  distributionPeriod: string;
}

export default function VendorRegistrationPage() {
  const [form, setForm] = useState<VendorForm>({
    companyName: '',
    website: '',
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    telephone: '',
    state: '',
    city: '',
    location: '',
    companyAddress: '',
    pincode: '',
    category: '',
    goodsServices: '',
    panCard: '',
    gstNo: '',
    gstRegistrationType: 'Regular',
    distributionPeriod: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof VendorForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Frontend-only for now — simulate submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success('Thank you! Your vendor registration has been submitted. Our team will get in touch soon.');
    setIsSubmitting(false);
    // Reset form
    setForm({
      companyName: '', website: '', firstName: '', lastName: '',
      email: '', mobile: '', telephone: '', state: '', city: '',
      location: '', companyAddress: '', pincode: '',
      category: '', goodsServices: '', panCard: '', gstNo: '',
      gstRegistrationType: 'Regular', distributionPeriod: '',
    });
  };

  const inputClass = "w-full rounded-[10px] border border-gray-200 px-4 py-3.5 text-[15px] placeholder:text-gray-400 focus:border-[#5F6F52] focus:ring-1 focus:ring-[#5F6F52] focus:outline-none transition-all shadow-sm bg-white";
  const selectClass = "w-full rounded-[10px] border border-gray-200 px-4 py-3.5 text-[15px] text-gray-700 focus:border-[#5F6F52] focus:ring-1 focus:ring-[#5F6F52] focus:outline-none transition-all shadow-sm bg-white appearance-none cursor-pointer";
  const labelClass = "block text-[11px] font-bold uppercase tracking-wider text-[#1A1A1A] mb-1.5";

  return (
    <div className="relative min-h-screen bg-[#F6F7F4] overflow-hidden selection:bg-[#5F6F52] selection:text-white pb-16">
      {/* Background Image Watermarks */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 0.3, x: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        style={{ willChange: "transform, opacity" }}
        className="absolute top-[-5%] left-[-10%] w-[1000px] h-[1000px] pointer-events-none z-0"
      >
        <Image
          src="/Contact%20Us%202.png"
          alt=""
          fill
          sizes="(max-width: 1000px) 100vw, 1000px"
          className="object-contain"
          priority
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 0.7, x: 0 }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
        style={{ willChange: "transform, opacity" }}
        className="absolute top-[30%] right-[-15%] w-[800px] h-[1000px] pointer-events-none z-0"
      >
        <Image
          src="/Contact%20Us%201.png"
          alt=""
          fill
          sizes="(max-width: 800px) 100vw, 800px"
          className="object-contain"
          priority
        />
      </motion.div>

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
        style={{ willChange: "transform, opacity" }}
        className="relative z-10 pt-10 pb-4 sm:pt-14 sm:pb-6 text-left px-4 max-w-[1240px] mx-auto sm:px-6 lg:px-8"
      >

        <h1 className="text-[36px] leading-tight sm:text-5xl font-bold text-[#1A1A1A] mb-3 tracking-tight">
          Vendor Registration
        </h1>
        <p className="text-[#1A1A1A] text-sm sm:text-base leading-relaxed">
          Do you have a quality product that needs an audience? We at Vedashi believe in joining hands with the right partners in order to provide high-quality and open our vendors to the outer world. We invite suppliers to join us in our endeavour to offer the best to our customers.
        </p>
        <p className="text-[#1A1A1A] text-sm sm:text-[15px] leading-relaxed mt-2">
          You may continue to fill in the below form along with your product details. Our team will get in touch with you based on requirements.
        </p>
        <p className="text-[#5F6F52] text-xs mt-3 font-semibold tracking-wide">
          Fields marked with <span className="text-red-500">*</span> are mandatory.
        </p>
      </motion.section>

      {/* Form Section */}
      <div className="relative z-10 mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          style={{ willChange: "transform, opacity" }}
          className="rounded-[24px] bg-white p-6 sm:p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100"
        >
          {/* ───── CONTACT DETAILS ───── */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f5f2]">
                <User className="h-4 w-4 text-[#5F6F52]" strokeWidth={2} />
              </div>
              <h2 className="text-2xl font-bold text-[#1A1A1A]">Contact Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              {/* Company Name */}
              <div>
                <label className={labelClass}>Name of Organisation / Company <span className="text-red-500">*</span></label>
                <input type="text" value={form.companyName} onChange={e => updateField('companyName', e.target.value)} className={inputClass} placeholder="Enter Name of Organisation / Company" required disabled={isSubmitting} />
              </div>
              {/* Website */}
              <div>
                <label className={labelClass}>Website <span className="text-red-500">*</span></label>
                <input type="text" value={form.website} onChange={e => updateField('website', e.target.value)} className={inputClass} placeholder="Enter Website" required disabled={isSubmitting} />
              </div>
              {/* First Name */}
              <div>
                <label className={labelClass}>First Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.firstName} onChange={e => updateField('firstName', e.target.value)} className={inputClass} placeholder="Enter First Name" required disabled={isSubmitting} />
              </div>
              {/* Last Name */}
              <div>
                <label className={labelClass}>Last Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.lastName} onChange={e => updateField('lastName', e.target.value)} className={inputClass} placeholder="Enter Last Name" required disabled={isSubmitting} />
              </div>
              {/* Email */}
              <div>
                <label className={labelClass}>Email Id <span className="text-red-500">*</span></label>
                <input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} className={inputClass} placeholder="Enter Email Id" required disabled={isSubmitting} />
              </div>
              {/* Mobile */}
              <div>
                <label className={labelClass}>Mobile No <span className="text-red-500">*</span></label>
                <input type="tel" value={form.mobile} onChange={e => updateField('mobile', e.target.value)} className={inputClass} placeholder="Enter Mobile No" required disabled={isSubmitting} />
              </div>
              {/* Telephone */}
              <div>
                <label className={labelClass}>Telephone No</label>
                <input type="tel" value={form.telephone} onChange={e => updateField('telephone', e.target.value)} className={inputClass} placeholder="Enter Telephone No" disabled={isSubmitting} />
              </div>
              {/* State */}
              <div className="relative">
                <label className={labelClass}>State <span className="text-red-500">*</span></label>
                <select value={form.state} onChange={e => updateField('state', e.target.value)} className={selectClass} required disabled={isSubmitting}>
                  <option value="" disabled>Select State</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-[38px] h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              {/* City */}
              <div>
                <label className={labelClass}>City <span className="text-red-500">*</span></label>
                <input type="text" value={form.city} onChange={e => updateField('city', e.target.value)} className={inputClass} placeholder="Enter City" required disabled={isSubmitting} />
              </div>
              {/* Location */}
              <div>
                <label className={labelClass}>Location <span className="text-red-500">*</span></label>
                <input type="text" value={form.location} onChange={e => updateField('location', e.target.value)} className={inputClass} placeholder="Enter Location" required disabled={isSubmitting} />
              </div>
              {/* Company Address — full width */}
              <div className="md:col-span-2">
                <label className={labelClass}>Company Address <span className="text-red-500">*</span></label>
                <input type="text" value={form.companyAddress} onChange={e => updateField('companyAddress', e.target.value)} className={inputClass} placeholder="Enter Company Address" required disabled={isSubmitting} />
              </div>
              {/* Pincode */}
              <div>
                <label className={labelClass}>Pincode <span className="text-red-500">*</span></label>
                <input type="text" value={form.pincode} onChange={e => updateField('pincode', e.target.value)} className={inputClass} placeholder="Enter Pincode" required disabled={isSubmitting} />
              </div>
            </div>
          </div>


          {/* Submit Button */}
          <div className="mt-12 flex justify-center">
            <motion.button
              whileHover={{ scale: isSubmitting ? 1 : 1.02, y: isSubmitting ? 0 : -2 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2.5 rounded-xl bg-[#00472f] px-10 py-4 text-[15px] font-semibold text-white hover:bg-[#003822] transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(0,71,47,0.25)] hover:shadow-[0_8px_24px_rgba(0,71,47,0.35)]"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Registration'}
              <Send className={`h-4 w-4 ${isSubmitting ? 'animate-pulse' : ''}`} />
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
