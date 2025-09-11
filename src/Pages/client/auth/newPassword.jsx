import { Card } from '@/components/ui/card'
import React from 'react'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const newPassword = () => {

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
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
              <p className='text-gray-600 mt-2'>Vui lòng nhập mật khẩu mới của bạn</p>
            </div>
            {
              // input 
            }
            <div className='space-y-2'>
              <label className='block text-gray-700 mb-2' htmlFor='password' >Mật khẩu mới</label>
              <Input
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='Nhập mật khẩu mới của bạn'
                required
              > </Input>
            </div>
            {
              // input password
            }
            {/* Password */}
            <div className='space-y-2 '>
              <label className='block text-gray-700 mb-2' htmlFor='password'>Nhập lại mật khẩu</label>
              <div className='relative'>
                <Input
                  id='confirmPassword'
                  type={showPassword ? 'text' : 'password'}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  value={confirmPassword}
                  placeholder='Nhập lại mật khẩu của bạn'
                  required
                />
              </div>
            </div>

            <div className=' flex justify-end items-end'>
              <p className='text-sm text-gray-600 hover:text-primary hover:underline cursor-pointer'>Quên mật khẩu?</p>
            </div>
            <div>
              <Button input className='w-full h-10'>
                Xác nhận
              </Button>
            </div>
          </div>






        </motion.div>
      </div>
    </>
  )
}

export default newPassword
