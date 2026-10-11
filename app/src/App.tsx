import TemplateGrid from "./components/TemplateGrid";
import Navigation from "./components/Navigation";
import Search from "./components/Search";
import { useStore } from "@/store";
import "./App.css";
import { BrowserRouter } from "react-router-dom";

function App() {
  const view = useStore((state) => state.view);

  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Navigation />
        <Search />
        <TemplateGrid view={view} />
      </div>
    </BrowserRouter>
  );
}

export default App;
