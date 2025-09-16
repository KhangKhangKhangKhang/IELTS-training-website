import React from 'react'
import { Link } from 'react-router-dom'
import { NavigationMenu, 
  NavigationMenuContent, 
  NavigationMenuItem, 
  NavigationMenuLink, 
  NavigationMenuList, 
  NavigationMenuTrigger } from "@/components/ui/navigation-menu"

function Header  () {
  const tokens = localStorage.getItem("access_token");
  console.log("access_tokens", tokens);
  return (
<>

</>
  )
}

export default Header
