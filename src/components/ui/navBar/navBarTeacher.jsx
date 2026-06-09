import React, { useState } from "react";
import AppTopbar from "./AppTopbar";
import ProfileModal from "./profileModal";

const NavbarTeacher = () => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  return (
    <>
      <AppTopbar
        role="teacher"
        brand="IELTS AI Practice"
        brandIcon="📘"
        accent="indigo"
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};

export default NavbarTeacher;
