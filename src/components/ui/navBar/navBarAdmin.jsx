import React, { useState } from "react";
import AppTopbar from "./AppTopbar";
import ProfileModal from "./profileModal";

const NavbarAdmin = () => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  return (
    <>
      <AppTopbar
        role="admin"
        brand="Admin Console"
        brandIcon="🛡️"
        accent="emerald"
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};

export default NavbarAdmin;
