import { Card } from '@/components/ui/card'
import React from 'react'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Await, useLocation } from 'react-router-dom'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { verifyOtpAPI } from '@/services/api'
import { resendOtpAPI } from '@/services/api'
import { useNavigate } from 'react-router-dom'

const OTP = () => {
  
  const [otp, setOtp] = useState("");
  const location = useLocation();
  const email = location.state?.email || "";
  const mode = location.state?.mode || "OTP";
  const navigate = useNavigate();
  const otp_reset = location.state?.otp_reset || "";

  const handleVerifyOtp = async() => {
    if(mode === "OTP"){
    try {
      const response = await verifyOtpAPI({email, otp});
      console.log("OTP verified successfully:", response);
      navigate('/login');


    }
    catch (error) {
      console.error("Error verifying OTP:", error);
    }
  }
}  
      
  

  // resend OTP
  const handleResendOtp = async () => {
    // try {
    //   const response = await resendOtpAPI({email});
    //   console.log("OTP resent successfully:", res);

    // }
    // catch (error) {
    //   console.error("Error resending OTP:", error);
    // }
    try {
    console.log("Payload resend:", { email }); // check dữ liệu gửi đi
    const response = await resendOtpAPI({ email, type: "FORGOT_PASSWORD" });
    console.log(email)
    console.log("Resend OTP success:", response.data);
  } catch (error) {
    console.error("Resend OTP error:", error.response?.data || error.message);
  }
  }
  return (
    <> 
    <div className='flex justify-center items-center  min-h-screen bg-gradient-to-br from-primary-50 to-primary-100'>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='w-full max-w-md '
        >
          <div className='bg-white p-8 rounded-lg shadow-xl space-y-6'>
            <div className='text-center mb-6'>
              <h2 className='text-3xl font-bold text-gray-800'>OTP</h2>
              <p className='text-gray-600 mt-2'>Nhập OTP gồm 6 số từ email</p>
              <div className='mt-7 flex justify-center items-between'>
                <InputOTP 
                maxLength={6}
                value={otp}
                  onChange={(value) => setOtp(value)}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button onClick={handleVerifyOtp} className='mt-7  h-10 w-5/6' >
                Xác nhận
                </Button>
            </div>
            <div className='text-center text-gray-600'>
              <p>Bạn chưa nhận được mã? 
                <span className='text-blue-500 cursor-pointer hover:underline' onClick={handleResendOtp}>
                Gửi lại
                </span>
                </p>
              
              </div>
          </div>


          
        </motion.div>
      </div>
    </>
  )
}

export default OTP
