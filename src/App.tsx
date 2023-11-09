import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import "@aws-amplify/ui-react/styles.css";
import { ThemeProvider, Authenticator } from "@aws-amplify/ui-react";
import { Category, Recommended, Header, Footer, Product } from "./components";

function App() {

  return (
    <ThemeProvider>
      <Authenticator.Provider>
        <Router>
          <Header />
          <Routes>
            <Route path="/" element={<Recommended />} />
            <Route
              path="/category/:name"
              element={<Category />}
            />
            <Route
              path="/product/:id"
              element={<Product />}
            />
          </Routes>
          <h2>This is my change to update the UI</h2>
          <Footer />
        </Router>
      </Authenticator.Provider>
    </ThemeProvider>
  );
}

export default App;