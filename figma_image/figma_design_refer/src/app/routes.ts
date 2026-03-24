import { createBrowserRouter } from "react-router";
import { MainLayout } from "./layouts/MainLayout";
import { HomePage } from "./pages/HomePage";
import { WorkbenchPage } from "./pages/WorkbenchPage";
import { ContactsPage } from "./pages/ContactsPage";
import { EditProfilePage } from "./pages/EditProfilePage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { VisitorPage } from "./pages/VisitorPage";
import { ExchangeConfirmPage } from "./pages/ExchangeConfirmPage";

import { MyCardsPage } from "./pages/MyCardsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: MainLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "workbench", Component: WorkbenchPage },
      { path: "contacts", Component: ContactsPage },
      { path: "edit", Component: EditProfilePage },
      { path: "cards", Component: MyCardsPage },
      { path: "analytics", Component: AnalyticsPage },
      { path: "visitors", Component: VisitorPage },
      { path: "exchange", Component: ExchangeConfirmPage },
    ],
  },
]);
