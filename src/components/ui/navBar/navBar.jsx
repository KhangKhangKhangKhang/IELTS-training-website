import React, { useState } from "react";
import AppTopbar from "./AppTopbar";
import ProfileModal from "./profileModal";

const Navbar = () => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  return (
    <>
      <AppTopbar
        role="student"
        brand="AIELTS"
        brandIcon="📘"
        accent="indigo"
        showXp
        showStreak
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};

export default Navbar;
