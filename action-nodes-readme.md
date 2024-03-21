# Obsidian.md Action Node Templates Guide

The Obsidian.md Action Node Templates Guide is an instructional compendium for integrating automated data fetching into your personal knowledge management setup using Obsidian.md. It provides a strategic blueprint for using action nodes, which are pre-configured HTTP requests, to seamlessly pull information from external APIs right into your notes.

>[!*tldr] # *TL;DR*: 
>This guide is a comprehensive manual for enhancing Obsidian.md with dynamic content through pre-set templates, enabling automated interactions with external data sources via various HTTP methods.

---

## Introduction to the Guide

In the era of digital note-taking and personal knowledge bases, Obsidian.md stands out as a versatile tool for managing and interlinking your ideas and information. The Obsidian.md Action Node Templates Guide elevates this experience by teaching you to automate the retrieval and incorporation of external data into your vault.

The guide walks you through the prerequisites, the initial setup, and detailed, real-world scenarios where action node templates can be applied, ranging from grabbing the latest news and weather updates to synchronizing tasks and retrieving financial data.

Each scenario is meticulously outlined with example configurations, including necessary code snippets that correspond with various HTTP methods like `POST` for creating, `PUT` for updating, and `DELETE` for removing resources. This allows your Obsidian.md vault to not just store data but also to interact dynamically with the world.

Furthermore, the guide delves into the technical aspects of HTTP methods, emphasizing the `GET` method, which forms the backbone of data retrieval operations. For each method, the guide provides a clear explanation, usage context, and step-by-step implementation examples, ensuring you can apply these templates confidently to your own projects.

Whether you're looking to automate routine information gathering, streamline your workflows, or simply make your notes more interactive and up-to-date, this guide is tailored to help you achieve that with precision and ease. The ultimate intention is to foster an environment where your digital notes don't just reflect past thoughts but also present insights and future possibilities, all within the bounds of your Obsidian.md vault.

---
# Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Scenario Implementations of GET](#scenario-implementations-of-get)
  - [Daily News Retrieval](#daily-news-retrieval)
  - [Weather Updates](#weather-updates)
  - [Task Automation](#task-automation)
  - [Content Aggregation](#content-aggregation)
  - [Data Logging](#data-logging)
  - [Note Synchronization](#note-synchronization)
  - [Learning and Documentation](#learning-and-documentation)
  - [Quote of the Day](#quote-of-the-day)
  - [Financial Monitoring](#financial-monitoring)
  - [Health and Lifestyle Tracking](#health-and-lifestyle-tracking)
- [HTTP Methods in Action Node Templates](#http-methods-in-action-node-templates)
  - [GET Method in Action Node Templates](#get-method-in-action-node-templates)
    - [GET](#get)
      - [Example 1: Retrieve a List of Repositories](#example-1-retrieve-a-list-of-repositories)
      - [Example 2: Get Currency Exchange Rates](#example-2-get-currency-exchange-rates)
  - [POST](#post)
    - [Example 1: Create a New Task](#example-1-create-a-new-task)
    - [Example 2: Start a Session](#example-2-start-a-session)
  - [PUT](#put)
    - [Example 1: Update a Document](#example-1-update-a-document)
    - [Example 2: Modify a Calendar Event](#example-2-modify-a-calendar-event)
  - [DELETE](#delete)
    - [Example 1: Delete a File](#example-1-delete-a-file)
    - [Example 2: Cancel a Meeting](#example-2-cancel-a-meeting)
- [Scheduling Templates](#scheduling-templates)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---
## Prerequisites

Before you begin, ensure you have:

- An active internet connection.
- An Obsidian.md Vault set up.
- Required API keys for the services you wish to access.
- Basic knowledge of JSON and HTTP request methods.

---
## Getting Started

1. **Install Obsidian.md**: Download and install the latest version of Obsidian.md from the [official website](https://obsidian.md/).

2. **API Key Setup**: For each external service you intend to use, register to obtain an API key and note down the API endpoints you will access.

1. **Understand Action Nodes**: Familiarize yourself with the concept of action nodes in Obsidian.md, which are essentially pre-defined HTTP requests that can interact with external APIs.

---
# HTTP Methods in Action Node Templates

>[!important] ## Overview

HTTP methods define the action to be performed on a resource. In the context of Obsidian.md action node templates, they allow you to interact with APIs in different ways. Below is an explanation of each HTTP method and examples of their usage.

---
# GET Method in Action Node Templates

The `GET` method requests data from a specified resource. It's used to retrieve information from a server at the specified resource. In Obsidian.md action node templates, `GET` is useful for pulling data into your notes for various integrations.

## GET

Using the `GET` method does not typically involve a request body since it is designed to retrieve data without affecting the data stored on the server. It is ideal for fetching documents, querying APIs for data, or simply reading information.

### Example 1: Retrieve a List of Repositories

>[!info] **Objective** 
>
Get a list of repositories from a GitHub user account.

```json
Name: "List Repositories"
URL: "https://api.github.com/users/YOUR_USERNAME/repos"
Method: GET
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_GITHUB_TOKEN"
}
Body Template: ""
```

### Example 2: Get Currency Exchange Rates

>[!info] **Objective** 
>
Fetch current currency exchange rates from a financial data provider.

```json
Name: "Currency Rates"
URL: "https://api.exchangeratesapi.io/latest"
Method: GET
Headers: {
  "Content-Type": "application/json"
}
Body Template: ""
```

In the `GET` method examples above, replace `YOUR_USERNAME` with your actual GitHub username and `YOUR_GITHUB_TOKEN` with your GitHub personal access token. For financial data, no authentication is required, but you should check if the API you're using needs an API key or token.

The `GET` method serves as the foundation for most data retrieval operations within Obsidian.md, facilitating a seamless flow of information from external resources into your personal knowledge management system. Use these action node templates as a starting point to customize and extend the functionality of your vault with live data feeds and integrations.

---
## Scenario Implementations of GET

### Daily News Retrieval

>[!info] **Objective** 
>
Fetch daily news summaries or headlines from a news API.

**Steps**:

1. **API Registration**: Sign up for a news API like [NewsAPI](https://newsapi.org/) and obtain your API key.

2. **Action Node Setup**:

```json
Name: "Daily News Fetch"
URL: "https://newsapi.org/v2/top-headlines?country=us"
Method: GET
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_API_KEY"
}
Body Template: ""
```

### Weather Updates

>[!info] **Objective** 
>
Get real-time weather information.

**Steps**:

1. **API Registration**: Get an API key from a weather service like [OpenWeatherMap](https://openweathermap.org/api).

2. **Action Node Setup**:

```json
Name: "Weather Update"
URL: "https://api.openweathermap.org/data/2.5/weather?q=YOUR_CITY&appid=YOUR_API_KEY"
Method: GET
Headers: {
  "Content-Type": "application/json"
}
Body Template: ""
```

### Task Automation

>[!info] **Objective** 
>
Integrate with a task management service to manage tasks.

**Steps**:

1. **API Registration**: Use an API from a service like Todoist.

2. **Action Node Setup**:

```json
Name: "Fetch Tasks"
URL: "https://api.todoist.com/rest/v1/tasks"
Method: GET
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_API_KEY"
}
Body Template: ""
```

Replace "YOUR_API_KEY" with your actual API key and "YOUR_CITY" with your city name.

Continuing with the technical documentation for the remaining scenarios:

---
### Content Aggregation

>[!info] **Objective** 
>
Pull articles or blog posts based on specified keywords.

**Steps**:

1. **API Registration**: Choose a content aggregator API like [Feedly's API](https://developer.feedly.com/).

2. **Action Node Setup**:

```json
Name: "Content Aggregator"
URL: "https://cloud.feedly.com/v3/search/feeds?query=YOUR_KEYWORD"
Method: GET
Headers: {
  "Content-Type": "application/json"
}
Body Template: ""
```

Replace `YOUR_KEYWORD` with the topic you want to fetch articles about.

---
### Data Logging

>[!info] **Objective** 
>
Retrieve data from IoT devices or sensors.

**Steps**:

1. **API Setup**: Ensure your IoT device provides an API endpoint.

2. **Action Node Setup**:

```json
Name: "IoT Data Logger"
URL: "http://YOUR_IOT_DEVICE_ENDPOINT"
Method: GET
Headers: {
  "Content-Type": "application/json"
}
Body Template: ""
```

Replace `YOUR_IOT_DEVICE_ENDPOINT` with the actual endpoint provided by your IoT device.

---
### Note Synchronization

>[!info] **Objective** 
>
>Sync notes with a cloud service.

**Steps**:

1. **API Registration**: Set up an account with a cloud storage provider like Dropbox that offers an API.

2. **Action Node Setup**:

```json
Name: "Note Sync"
URL: "https://api.dropboxapi.com/2/files/list_folder"
Method: POST
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_ACCESS_TOKEN"
}
Body Template: "{\"path\": \"\"}"
```

Replace `YOUR_ACCESS_TOKEN` with your Dropbox API access token.

---
### Learning and Documentation

>[!info] **Objective** 
>
Fetch the latest documentation or tutorials.

**Steps**:

1. **Find Documentation Source**: Identify a source with a structured API endpoint.

2. **Action Node Setup**:

```json
Name: "Learning Resources Fetcher"
URL: "https://api.github.com/repos/YOUR_GITHUB_USER/YOUR_REPO/contents/"
Method: GET
Headers: {
  "Content-Type": "application/json"
}
Body Template: ""
```

Replace `YOUR_GITHUB_USER` and `YOUR_REPO` with the appropriate GitHub username and repository.

---
### Quote of the Day

>[!info] **Objective** 
 Get a daily quote.

**Steps**:

1. **API Registration**: Use a quotation API like [They Said So Quotes API](https://theysaidso.com/api/).

2. **Action Node Setup**:

```json
Name: "Daily Quote"
URL: "https://quotes.rest/qod"
Method: GET
Headers: {
  "Content-Type": "application/json"
}
Body Template: ""
```

---
### Financial Monitoring

>[!*info] **Objective**
>
>Retrieve financial data.

**Steps**:

1. **API Registration**: Get an API key from a financial data provider like [Alpha Vantage](https://www.alphavantage.co/).

2. **Action Node Setup**:

```json
Name: "Stock Data Fetch"
URL: "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=IBM&apikey=YOUR_API_KEY"
Method: GET
Headers: {
  "Content-Type": "application/json"
}
Body Template: ""
```

Replace `YOUR_API_KEY` with your actual API key and `IBM` with the stock symbol you want to track.

---
### Health and Lifestyle Tracking

>[!info] **Objective** 
> Connect to health APIs for fitness data.

**Steps**:

1. **API Registration**: Choose a health tracking service that offers an API, like [Fitbit](https://dev.fitbit.com/).

2. **Action Node Setup**:

```json
Name: "Fitness Data Retrieval"
URL: "https://api.fitbit.com/1/user/-/activities/date/today.json"
Method: GET
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_ACCESS_TOKEN"
}
Body Template: ""
```

Replace `YOUR_ACCESS_TOKEN` with the token provided by Fitbit after authorization.

For each template, ensure to replace placeholders with the actual values you will be using. This may involve configuring environment variables or otherwise securing your API keys and tokens. Additionally, check the API documentation for each service you use, as the endpoints, required parameters, and available methods may vary.


>[!NOte] NOTE 
>
> These templates provide the basic structure for integrating various services with your Obsidian.md vault using action nodes. Always test your configuration in a secure environment before deploying it to your live vault to avoid exposing sensitive information and to ensure the correct operation of the templates.

---
## POST

The `POST` method sends data to the server to create a new resource. It is often used to submit form data or upload a file.

### Example 1: Create a New Task

>[!info] **Objective** 
>
Add a new task to a task management system like Todoist.

```json
Name: "Create Task"
URL: "https://api.todoist.com/rest/v1/tasks"
Method: POST
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_API_KEY"
}
Body Template: "{ \"content\": \"[Task Name]\", \"due_string\": \"[Due Date]\", \"priority\": [Priority Level] }"
```

### Example 2: Start a Session

>[!info] **Objective** 
>
Start a new session in a time tracking application like Toggl.

```json
Name: "Start Time Entry"
URL: "https://api.track.toggl.com/api/v8/time_entries/start"
Method: POST
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Basic YOUR_AUTH_TOKEN"
}
Body Template: "{ \"time_entry\": { \"description\": \"[Entry Description]\", \"created_with\": \"Obsidian\" } }"
```

---
## PUT

The `PUT` method replaces all current representations of the target resource with the request payload. It is used for updating data.

### Example 1: Update a Document

>[!info] **Objective** 
>
Update a document in a cloud storage service like Google Drive.

```json
Name: "Update Document"
URL: "https://www.googleapis.com/drive/v3/files/YOUR_FILE_ID"
Method: PUT
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_ACCESS_TOKEN"
}
Body Template: "{ \"name\": \"[New Name]\", \"description\": \"[New Description]\", \"content\": \"[File Content]\" }"
```

### Example 2: Modify a Calendar Event

>[!info] **Objective** 
>
Update an event in a calendar application like Google Calendar.

```json
Name: "Update Event"
URL: "https://www.googleapis.com/calendar/v3/calendars/YOUR_CALENDAR_ID/events/YOUR_EVENT_ID"
Method: PUT
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_ACCESS_TOKEN"
}
Body Template: "{ \"summary\": \"[New Summary]\", \"location\": \"[New Location]\", \"start\": { \"dateTime\": \"[Start Time]\" }, \"end\": { \"dateTime\": \"[End Time]\" } }"
```

---
## DELETE

The `DELETE` method removes the specified resource.

### Example 1: Delete a File

>[!info] **Objective** 
>
Remove a file from a cloud storage provider like Dropbox.

```json
Name: "Delete File"
URL: "https://api.dropboxapi.com/2/files/delete_v2"
Method: DELETE
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_ACCESS_TOKEN"
}
Body Template: "{ \"path\": \"/path/to/your/file.txt\" }"
```

### Example 2: Cancel a Meeting

>[!info] **Objective** 
>
Delete a meeting from a scheduling service like Calendly.

```json
Name: "Cancel Meeting"
URL: "https://api.calendly.com/scheduled_events/YOUR_EVENT_UUID"
Method: DELETE
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_API_KEY"
}
Body Template: ""
```

>[!ATTention] REMINDER:
>
>Remember to replace placeholders such as `YOUR_API_KEY`, `YOUR_AUTH_TOKEN`, `YOUR_ACCESS_TOKEN`, `YOUR_FILE_ID`, `YOUR_CALENDAR_ID`, `YOUR_EVENT_ID`, and `YOUR_EVENT_UUID` with your actual data.

> The examples above are generic templates and might need to be adjusted based on the API's requirements you are interacting with. Always refer to the API's official documentation for accurate endpoints, required headers, and JSON structure. Additionally, keep your API keys and tokens secure and never expose them in public repositories or unsecured files.

---
## Scheduling Templates

To schedule action nodes:

1. **Choose a Scheduling Plugin**: Install a scheduling plugin if available or use an external task scheduler like cron on your system.

2. **Configure Schedules**: Define when each action node should trigger (e.g., daily for news, every hour for weather).

---
## Troubleshooting

If you encounter issues:

1. **Check API Limits**: Ensure you haven't exceeded the API call limits.
2. **Validate API Keys**: Re-check your API keys and request headers.
3. **Inspect Error Logs**: Review the error logs for any clues.

---
## Contributing

To contribute to this project:

1. **Fork the Repository**: Create a copy of this project on GitHub.
2. **Make Changes**: Implement improvements or add new features.
3. **Submit a Pull Request**: Open a PR to merge your changes.

---
## License

MIT LICENSE - as of 2024 (As per David Youngblood, of LouminAI Labs)

---
