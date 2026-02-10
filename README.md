# Amara
HeyAmara ....
AMARA — Local AI Daemon for Intelligent File Automation

A Hybrid Local-First + Cloud-Optional Autonomous Watcher System


Overview

Amara is a TypeScript-based, always-on local daemon that monitors your filesystem, interprets natural-language rules, automates actions, logs system behavior, and optionally synchronizes data to a cloud backend.
It is designed for developers who work deeply with AI-assisted coding and need a reliable companion that observes, learns, and responds intelligently.

Amara follows a local-first architecture, with optional hybrid cloud capabilities via Supabase and secure session management using Redis and JWT.
The system is modular, secure, and extendable, offering intelligence far beyond the base requirements of the HeyAmara Challenge.


Core Capabilities

1. File Watching

Amara monitors configured directories and reacts to:
	•	File creation
	•	File modification
	•	File deletion

All events are recorded and processed in real-time.


2. Natural-Language Rule Learning

Users can describe rules in plain English.
Amara uses a local LLM (Ollama: Llama3 or Qwen2.5) to convert natural language into structured logic.

Example input:
“Notify me when any .txt file containing the word urgent is modified.”

Amara converts this into a structured rule with:
	•	Trigger type
	•	File pattern
	•	Optional conditions (text content, size constraints)
	•	Notification message

Rules persist across restarts.


3. Autonomous Rule Engine

Amara evaluates all incoming file events against all stored rules.
The engine checks:
	•	Trigger match
	•	Filename pattern match
	•	Optional file-content conditions
	•	Optional file-size conditions

If a rule matches, Amara fires an action immediately.


4. Persistent Memory and Logging

Amara stores all rules in data/rules.json and logs all activity to:
	•	events.log
	•	matches.log
	•	errors.log

This provides an auditable history of system behavior.


5. Notification System

Amara triggers system-level notifications through node-notifier whenever a rule fires.
The notification mechanism can be swapped for custom integrations.


6. Telemetry Tracking

Amara maintains real-time telemetry:
	•	Total events
	•	Total rule matches
	•	Error count
	•	Last event timestamp

Telemetry syncs locally and optionally to the cloud.


Advanced System Features

CodeFusion Engine

A TypeScript analysis engine that detects:
	•	Syntax errors
	•	Import mismatches
	•	Unused variables
	•	Type issues
	•	Missing exports

It can also request auto-fixes using a local LLM.
Outputs are formatted as patch suggestions.


Redis Security Layer

Redis is used to manage:
	•	Refresh tokens
	•	Token blacklisting
	•	Session control
	•	Rate limiting
	•	Rule and event caching

The Redis layer enhances both security and performance.

JWT Session Management

Amara uses short-lived access tokens and rotating refresh tokens.
Security properties include:
	•	HTTP-only cookies
	•	Token rotation
	•	Replay-attack protection
	•	CSRF protection
	•	Expiry validation

This ensures that only authenticated clients can interact with cloud API components.


Supabase Cloud Sync (Optional)

Amara supports hybrid execution:
	•	Works fully offline
	•	Synchronizes rules, events, and telemetry to Supabase when online
	•	Supports real-time rule updates using Supabase subscriptions

This allows multi-device usage and remote monitoring while preserving local functionality.


  Installation Guide

1. Clone Repository : || git clone <your-repo-url> cd amara ||
2. Install Dependencies :  || npm install npm install ||
3. Install and Configure Ollama Install a local LLM : || ollama pull llama3 or ollama pull qwen2.5 ||
4. Environment Setup Create .env : || SUPABASE_URL= SUPABASE_KEY= REDIS_URL= ||
5. Running Amara Start the Daemon : || npm run dev ||
6. Add Rules via Natural Language Simply type in the terminal: || Notify me when any .md file is updated. ||


Capabilities Summary

Amara can:
	•	Learn rules from natural language
	•	Monitor directories in real time
	•	Automatically generate notifications
	•	Maintain persistent memory
	•	Sync to the cloud
	•	Analyze your code using AI
	•	Secure its own sessions
	•	Scale across multiple devices
	•	Operate offline without dependencies

Amara is designed to function as a trusted background assistant for developers.

What Amara Excels At
	•	Reliable file-event automation
	•	Accurate natural-language rule parsing
	•	Intelligent feedback via CodeFusion
	•	Resilient security
	•	Local-first execution
	•	Hybrid offline/online operation
	•	Production-ready structure

Potential Limitations
	•	High-frequency file operations may stress the watcher
	•	Large logs require rotation
	•	Local LLM parsing may slow under heavy rule load
	•	Realtime sync may lag on weak networks
	•	CodeFusion suggestions depend on model consistency

These are known and can be enhanced in future iterations.


License

MIT License
