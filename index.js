/*
 * Name: Nate Gibson
 * Date: 11/12/18
 * Section: CSE 154 AL
 *
 * This is the JS to implement the UI for adding and removing user-inputted and randomly-generated
 * tasks and plans, and displaying the current weather in a given regionfor my daily planner.
 */

(function() {
  "use strict";

  const REMOVE_DELAY_MS = 50;
  const GENERATOR_URL = "generator.php";
  const WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";
  const WEATHER_API_KEY = "da327078ea0fc8b3049aca32d8049ae7";

  let clearPlansTimer = null;
  let clearTasksTimer = null;

  window.addEventListener("load", initialize);

  /**
   * Initializes the page, adding an initial plan to the page, and allowing users to interact with
   * 2 sets (plans and tasks) of 4 buttons (add, add rand, remove last, clear), and one
   * "get weather" button.
   */
  function initialize() {
    addPlan(null);  //If I start with a plan in html, formatting is messed up when adding new plans.

    $("add-plan-btn").addEventListener("click", addPlan);
    $("add-rand-plan-btn").addEventListener("click", getRandPlan);
    $("remove-last-plan-btn").addEventListener("click", function() {
      removeLast($("plans"), null);
    });
    $("clear-plans-btn").addEventListener("click", function() {
      clearAll($("plans"), clearPlansTimer);
    });

    $("add-task-btn").addEventListener("click", addTask);
    $("add-rand-task-btn").addEventListener("click", getRandTask);
    $("remove-last-task-btn").addEventListener("click", function() {
      removeLast($("tasks"), "");
    });
    $("clear-tasks-btn").addEventListener("click", function() {
      clearAll($("tasks"), clearTasksTimer);
    });

    $("get-weather-btn").addEventListener("click", getWeather);
  }

  /**
   * Adds a new plan consisting of 6 new elements to the plans section of the html page.
   */
  function addPlan() {
    let planChildren = [];
    planChildren.push(createMyElement("input", "time", "00:00", null));
    planChildren.push(createMyElement("p", null, null, "to"));
    planChildren.push(createMyElement("input", "time", "00:00", null));
    planChildren.push(createMyElement("p", null, null, "I will"));
    planChildren.push(createMyElement("input", "plan", "your plan", null));

    let newPlan = createMyElement("div", "complete-plan", null, null);
    addMyChildren(planChildren, newPlan);

    let plans = $("plans");
    plans.appendChild(newPlan);
  }

  /**
   * Adds a new task consisting of 2 new elements to the tasks section of the html page.
   */
  function addTask() {
    let task = createMyElement("input", null, "your task", null);
    let newListItem = document.createElement("li");
    newListItem.appendChild(task);

    $("tasks").appendChild(newListItem);
  }

  /**
   * Removes the last element of a list in section if there is more than one list element remaining,
   * then clears the inputed values of the remaining list element, and clears timer (if it exists).
   * @param {element} section - list section
   * @param {timer} timer - global timer variable
   */
  function removeLast(section, timer) {
    let numOfChildren = section.children.length;
    let lastChild = section.children[numOfChildren - 1];

    if (numOfChildren > 1) {
      section.removeChild(lastChild);
    } else {
      qsa("#" + section.id + " input").forEach(function(input) {
        input.value = "";
      });

      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }
  }

  /**
   * Clears all items in a list every 0.3 seconds if there is more than one list element remaining,
   * then clears the inputed values (after 0.3 seconds) of the remaining list element.
   * @param {element} section - list section
   * @param {timer} sectionTimer - global timer variable
   */
  function clearAll(section, sectionTimer) {
    let timer = sectionTimer;
    if(!timer) {
      timer = setInterval(function() {removeLast(section, timer);}, REMOVE_DELAY_MS);
    }
  }

  /**
   * Gets a new random task and adds it to the tasks list.
   */
  function getRandTask() {
    $("task-error").innerText = "";

    let url = GENERATOR_URL + "?type=task";
    fetch(url)
      .then(checkStatus)
      .then(addRandTask)
      .catch(reportTaskError);
  }

  /**
   * Adds task to the task list. Populates the last empty task, or makes and new task to populate.
   * @param {string} task - task value string
   */
  function addRandTask(task) {
    let tasks = $("tasks").querySelectorAll("input");
    let lastTask = tasks[tasks.length - 1];

    if (lastTask.value !== "") {
      addTask();
      tasks = $("tasks").querySelectorAll("input");
      lastTask = tasks[tasks.length - 1];
    }

    lastTask.value = task;
  }

  /**
   * Reports an error in getting a new random task from the generator api to the user.
   * @param {string} error - error string
   */
  function reportTaskError(error) {
    $("task-error").innerText = error;
  }

  /**
   * Adds a new random plan to the plans list.
   */
  function getRandPlan() {
    $("plan-error").innerText = "";

    let url = GENERATOR_URL + "?type=plan";
    fetch(url)
      .then(checkStatus)
      .then(JSON.parse)
      .then(addRandPlan)
      .catch(reportPlanError);
  }

  /**
   * Adds plan to the plan list. Populates last empty plan, or makes new plan to populate.
   * @param {object} plan - parsed json object with plan values
   */
  function addRandPlan(plan) {
    let plans = qsa(".complete-plan");
    let lastPlanInputs = plans[plans.length - 1].querySelectorAll("input");

    if (!valuesEmpty(lastPlanInputs)) {
      addPlan();
      plans = qsa(".complete-plan");
      lastPlanInputs = plans[plans.length - 1].querySelectorAll("input");
    }

    lastPlanInputs[0].value = plan.start;
    lastPlanInputs[1].value = plan.end;
    lastPlanInputs[2].value = plan.plan;
  }

  /**
   * Reports an error in getting a new random plan from the generator api to the user.
   * @param {string} error - error string
   */
  function reportPlanError(error) {
    $("plan-error").innerText = error;
  }

  /**
   * Fetches current weather information for an inputed zipcode and displays it as UI.
   */
  function getWeather() {
    $("weather-info").innerHTML = "";
    $("weather-error").innerText = "";

    let zip = $("zip").value;
    let url = WEATHER_URL + "?zip=" + zip + "&APPID=" + WEATHER_API_KEY;
    fetch(url, {mode : "cors"})
      .then(checkStatus)
      .then(JSON.parse)
      .then(updateWeather)
      .catch(reportWeatherError);
  }

  /**
   * Displays weather information from array data as UI in p elements.
   * @param {array} data - array parsed from JSON object of weather data
   */
   function updateWeather(data) {
     let weatherElements = [];
     weatherElements.push(createMyElement("p",
                                          null,
                                          null,
                                          "Location: " + data.name));
     weatherElements.push(createMyElement("p",
                                          null,
                                          null,
                                          "Status: " + data.weather[0].description));
     let currentTemp = (Math.round(((data.main.temp * (9 / 5)) - 459.67) * 100) / 100);
     weatherElements.push(createMyElement("p",
                                          null,
                                          null,
                                          "Temperature: " + currentTemp + "°F"));
     weatherElements.push(createMyElement("p",
                                          null,
                                          null,
                                          "Humidity: " + data.main.humidity + "%"));
     weatherElements.push(createMyElement("p",
                                          null,
                                          null,
                                          "Wind Speed: " + data.wind.speed + "m/s"));

     addMyChildren(weatherElements, $("weather-info"));
   }

   /**
    * Displays fetch error as UI in a p elements
    * @param {string} error - fetch catch error
    */
    function reportWeatherError(error) {
      $("weather-error").innerText = error;
    }

    /**
    * Helper function to Create and return a new HTML element of specified type, class, placeholder
    * and inner text.
    * @param {string} type - a string for an element type
    * @param {string} myClass - a string for an element class
    * @param {string} placeholder - a string for element placeholder text
    * @param {string} text - a string for element inner text
    * @returns {element} - returns a new HTML element of tag type
     */
    function createMyElement(type, myClass, placeholder, text) {
      let createdItem = null;
      if (type) {
        createdItem = document.createElement(type);
        if (myClass) {
          createdItem.classList.add(myClass);
        }
        if (placeholder) {
          createdItem.placeholder = placeholder;
        }
        if (text) {
          createdItem.innerText = text;
        }
      }
      return createdItem;
    }

    /**
     * Helper function to add children in children array to parent element parent.
     * @param {array} children - array of elements
     * @param {element} parent - an HTML element
     */
    function addMyChildren(children, parent) {
      children.forEach(function(child) {
        parent.appendChild(child);
      });
    }

    /**
     * Returns if the values of elements are empty.
     * @param {nodeList} elements - nodeList of DOM elements
     * @returns {boolean} - returns if elements' values are all empty
     */
    function valuesEmpty(elements) {
      let result = true;
      elements.forEach(function(element) {
        if (element.value !== "") {
          result = false;
        }
      });
      return result;
    }

    /**
     * Returns the element that has the ID attribute with the specified value.
     * @param {string} id - element ID
     * @returns {object} DOM object associated with id.
     */
    function $(id) {
    return document.getElementById(id);
    }

    /**
     * Returns the array of elements that match the given CSS selector.
     * @param {string} query - CSS query selector
     * @returns {object[]} array of DOM objects matching the query.
     */
    function qsa(query) {
      return document.querySelectorAll(query);
    }

    /**
     * Helper function to return the response's result text if successful, otherwise
     * returns the rejected Promise result with an error status and corresponding text
     * @param {object} response - response to check for success/error
     * @returns {object} - valid result text if response was successful, otherwise rejected
     *                     Promise result
     */
     function checkStatus(response) {
      const OK = 200;
      const ERROR = 300;
      let responseText = response.text();
      if (response.status >= OK && response.status < ERROR || response.status === 0) {
        return responseText;
      } else {
        return responseText.then(Promise.reject.bind(Promise));
      }
    }
})();
