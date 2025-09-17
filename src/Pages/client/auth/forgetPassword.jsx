import { Card } from '@/components/ui/card'
import React from 'react'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { forgetPasswordAPI } from '@/services/apiAuth'
import { useLocation, useNavigate } from 'react-router'
const forgetPassword = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();



  const handleForgetPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      alert("Vui lòng nhập email");
      return;
    } 
    try {
      const res = await forgetPasswordAPI({ email });
      if (res) {
        navigate('/otp', {state: {email, mode: "RESET_LINK"}});
      }

    } catch (error) {
      console.error("Error sending reset email:", error);
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
              <h2 className='text-3xl font-bold text-gray-800'>Đặt lại mật khẩu</h2>
              <p className='text-gray-600 mt-2'>Nhập email để khôi phục</p>
            </div>
            <div className='space-y-2'>
              <label className='block text-gray-700 mb-2' htmlFor='email' >Email</label>
              <Input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='Nhập email của bạn'
                required
              > </Input>

              <Button onClick={handleForgetPassword} className='mt-7  h-10 w-full' >
                Gửi
              </Button>
            </div>
          </div>



        </motion.div>
      </div>
    </>
  )
}

export default forgetPassword
