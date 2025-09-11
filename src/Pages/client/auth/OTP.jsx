import { Card } from '@/components/ui/card'
import React from 'react'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"

const OTP = () => {
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
                <InputOTP maxLength={6}  >
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
              <Button type='hidden' className='mt-7  h-10 w-5/6' >
                Xác nhận
                </Button>
            </div>
          </div>


          
        </motion.div>
      </div>
    </>
  )
}

export default OTP
