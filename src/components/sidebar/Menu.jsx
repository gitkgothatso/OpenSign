import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { NavLink } from "react-router";
import { useUser } from "../../context/UserContext";

const Menu = ({ item, isOpen, closeSidebar }) => {
  const appName = "OpenSign™";
  const drivename = appName === "OpenSign™" ? "OpenSign™" : "";
  const { t } = useTranslation();
  const { selectedMenu } = useSelector((state) => state.sidebar);
  const { permissions, loading } = useUser();

  // If still loading or no permissions yet, show all items (don't filter)
  // This prevents hiding everything during initial load
  const shouldHide = item.requiresPermission && 
                     permissions && 
                     !loading && 
                     !permissions[item.requiresPermission];

  if (shouldHide) {
    return null; // Hide menu item if user doesn't have permission
  }

  return (
    <li key={item.title} role="none" className="my-0.5">
      <NavLink
        to={
          item.pageType
            ? `/${item.pageType}/${item.objectId}`
            : `/${item.objectId}`
        }
        className={({ isActive }) =>
          `${isActive && selectedMenu ? "bg-base-300 text-base-content" : ""} flex gap-x-5 items-center justify-start text-left p-3 text-base-content hover:text-base-content focus:bg-base-300 hover:bg-base-300 hover:no-underline focus:outline-none`
        }
        onClick={() => closeSidebar(item.title)}
        tabIndex={isOpen ? 0 : -1}
        role="menuitem"
      >
        <span className="w-[20px] h-[20px] flex justify-center">
          <i className={`${item.icon} text-[20px]`} aria-hidden="true"></i>
        </span>
        <span className="flex items-center mb-0.5">
          {t(`sidebar.${item.title}`, { appName: drivename })}
        </span>
      </NavLink>
    </li>
  );
};

export default Menu;
