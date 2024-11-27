import React from "react";
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/react";
import { useRouter } from "next/router";
function Breadcrumb() {
  const router = useRouter();
  return (
    <Breadcrumbs className="mb-4 pl-1">
      <BreadcrumbItem
        onPress={() => {
          router.push("/bridge");
        }}
        classNames={{
          item: "hover:text-white",
        }}
      >
        Aggregate
      </BreadcrumbItem>
      <BreadcrumbItem>Refuel</BreadcrumbItem>
    </Breadcrumbs>
  );
}

export default React.memo(Breadcrumb);
