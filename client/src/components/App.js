import React, { Component } from "react";

import { BrowserRouter as Router, Route, Switch, Redirect } from "react-router-dom";
import NotFound from "./pages/NotFound.js";
import SideBar from "./modules/SideBar.js";
import Public from "./pages/Public.js";
import Home from "./pages/Home.js";
import Page from "./pages/Page.js";
import Confirmation from "./pages/Confirmation.js";
import "../utilities.css";
import { Row, Col, Divider, Spin, Modal } from "antd";
import "antd/dist/antd.css";

import { socket } from "../client-socket.js";

import { get, post } from "../utilities";
import Cookies from "universal-cookie";
const cookies = new Cookies();
/**
 * Define the "App" component as a class.
 */
class App extends Component {
  // makes props available in this component
  constructor(props) {
    super(props);
    this.state = {
      userId: undefined,
      allPages: [],
      school: "",
      selectedPageName: "",
      redirectPage: "",
      tryingToLogin: true,
      // currentPageName from URL?
    };
  }

  componentDidMount() {
    get("/api/whoami").then((user) => {
      if (user._id) {
        // they are registed in the database, and currently logged in.
        this.me();
      } else {
        this.setState({ tryingToLogin: false });
      }
    });
    socket.on("disconnect", () => {
      this.setState({ disconnect: true });
    });
  }

  /*
  Methods from Public (Dan's login stuff)
  */
  login = (data) => {
    post("/api/login", data).then((res) => {
      cookies.set("token", res.token, { path: "/" });
      if (res.msg) {
        this.setState({ loginMessage: res.msg })
      }
      if (res.token) {
        this.setState({ loginMessage: "Success!" })
      }
      post("/api/initsocket", { socketid: socket.id }).then((data) => {
        if (data.init) this.me();
        else {
          this.setState({
            disconnect: true,
          });
        }
      });
    });
  };
  logout = () => {
    post("/api/logout", {}).then((res) => {
      cookies.set("token", "", { path: "/" });
      this.setState({ userId: undefined, tryingToLogin: false }, () => {
        window.location.href = "/";
      });
    });
  };
  me = () => {
    get("/api/me", {}, cookies.get("token")).then((res) => {
      if (!res.user) {
        this.logout();
        return;
      }

      this.setState({
        userId: res.user._id,
        schoolId: res.user.schoolId,
        name: res.user.name,
        loungeId: res.user.loungeId,
        pageIds: res.user.pageIds,
        isSiteAdmin: res.user.isSiteAdmin,
        email: res.user.email,
        visible: res.user.visible,
        allPages: res.allPages,
      });
    });
  };
  signup = (data) => {
    post("/api/signup", data).then((res) => {
      if (res.msg) {
        this.setState({ signUpMessage: res.msg })
      }
      // if (data.password.length < 6) {
      //   this.setState({ signUpMessage: "Please enter a longer password" })
      // }
    });
  };

  updatePageIds = (newPageIds) => {
    this.setState({ pageIds: newPageIds });
  };

  updateSelectedPageName = (page) => {
    this.setState({ selectedPageName: page });
  };

  redirectPage = (link) => {
    this.setState({ redirectPage: link });
  };

  setLoungeId = (newId) => {
    this.setState({ loungeId: newId });
  };

  logState = () => {
    console.log(this.state);
  };

  disconnect = () => {
    this.setState({ disconnect: true });
  };

  render() {
    if (!this.state.userId) {
      if (this.state.tryingToLogin) return <Spin />;
      return (
        <>
          <Router>
            <Switch>
              <Confirmation path="/confirmation/:token"></Confirmation>
              <Public
                visible={true}
                login={this.login}
                logout={this.logout}
                me={this.me}
                signup={this.signup}
                loginMessage={this.state.loginMessage}
                signUpMessage={this.state.signUpMessage}
              />
            </Switch>
          </Router>
        </>
      );
    }

    if (this.state.redirectPage !== "") {
      let page = this.state.redirectPage;
      this.setState({ redirectPage: "" });
      return (
        <Router>
          <Redirect to={page} />
        </Router>
      );
    }
    let myPages = this.state.allPages.filter((page) => {
      return this.state.pageIds.includes(page._id);
    });
    return (
      <div>
        {this.state.disconnect ? (
          <Modal
            visible={true}
            title={"Disconnected"}
            onCancel={() => {
              window.location.href = "/";
            }}
            onOk={() => {
              window.location.href = "/";
            }}
          >
            <p>You have disconnected.</p>
            <p>
              Maybe you opened Interstellar in another tab, or you have been inactive for a long
              period of time.
            </p>
            <p>Refresh to use Interstellar!</p>
          </Modal>
        ) : (
            <></>
          )}
        {/*<Row >
          <Col>
            <Public login={this.login} logout={this.logout} me={this.me} signup={this.signup} />
          </Col>
        </Row>*/}
        <Row>
          <Col span={6}>
            <SideBar
              pageIds={this.state.pageIds}
              allPages={this.state.allPages}
              myPages={myPages}
              selectedPageName={this.state.selectedPageName}
              redirectPage={this.redirectPage}
              logout={this.logout}
              logState={this.logState}
            />
          </Col>
          <Col span={18}>
            <Router>
              <Switch>
                <Home
                  exact
                  path="/"
                  schoolId={this.state.schoolId}
                  updateSelectedPageName={this.updateSelectedPageName}
                  user={{ userId: this.state.userId, name: this.state.name }}
                  redirectPage={this.redirectPage}
                  myPages={myPages}
                  disconnect={this.disconnect}
                />
                <Page
                  path="/class/:selectedPage"
                  schoolId={this.state.schoolId}
                  pageIds={this.state.pageIds}
                  updatePageIds={this.updatePageIds}
                  updateSelectedPageName={this.updateSelectedPageName}
                  user={{ userId: this.state.userId, name: this.state.name }}
                  redirectPage={this.redirectPage}
                  loungeId={this.state.loungeId}
                  setLoungeId={this.setLoungeId}
                  isSiteAdmin={this.state.isSiteAdmin}
                  disconnect={this.disconnect}
                />
                <Page
                  path="/group/:selectedPage"
                  schoolId={this.state.schoolId}
                  pageIds={this.state.pageIds}
                  updatePageIds={this.updatePageIds}
                  updateSelectedPageName={this.updateSelectedPageName}
                  user={{ userId: this.state.userId, name: this.state.name }}
                  redirectPage={this.redirectPage}
                  loungeId={this.state.loungeId}
                  setLoungeId={this.setLoungeId}
                  allPages={this.state.allPages}
                  isSiteAdmin={this.state.isSiteAdmin}
                  disconnect={this.disconnect}
                />
                <NotFound default />
              </Switch>
            </Router>
          </Col>
        </Row>
      </div>
    );
  }
}

export default App;
