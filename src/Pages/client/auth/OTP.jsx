import { Card } from '@/components/ui/card'
import React from 'react'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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
              <p className='text-gray-600 mt-2'>Nhập OTP</p>
            </div>
          </div>


          
        </motion.div>
      </div>
    </>
  )
}

export default OTP
