import React from 'react'

function Header  () {
  return (
<>
    <div className='p-4 bg-black flex items-center justify-between'>
      <div className='flex items-center space-x-4'> 
        <h1 className='text-white text-[40px] uppercase font-bold'>MyApp</h1>
        <nav className='flex items-center space-x-4'>

          <a href="#" className='text-white hover:text-gray-300'>Home</a>
          <a href="#" className='text-white hover:text-gray-300'>About</a>
          <a href="#" className='text-white hover:text-gray-300'>Services</a>
          <a href="#" className='text-white hover:text-gray-300'>Contact</a>
        </nav>
        <div className='flex items-center space-x-4'>
          <input type="text" placeholder='Search...' className='px-2 py-1 rounded' />
          <div className='text-white'>Login</div>
          <div className='text-white'>Sign Up</div>
        </div>

        </div>
    </div>
</>
  )
}

export default Header
