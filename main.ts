import {
	App,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
	addIcon,
} from "obsidian";
import { Configuration, OpenAIApi } from "openai";
import { Canvas } from "src/canvas";
import { CannoliFactory } from "src/factory";
import { CannoliGraph, VerifiedCannoliCanvasData } from "src/models/graph";
import { Run, Stoppage, Usage } from "src/run";
import { cannoliCollege } from "assets/cannoliCollege";
import { cannoliIcon } from "assets/cannoliIcon";

interface CannoliSettings {
	openaiAPIKey: string;
	costThreshold: number;
	defaultModel: string;
	defaultTemperature: number;
	httpTemplates: HttpTemplate[];
	addFilenameAsHeader?: boolean;
}

const DEFAULT_SETTINGS: CannoliSettings = {
	openaiAPIKey: "Paste key here",
	costThreshold: 0.5,
	defaultModel: "gpt-3.5-turbo",
	defaultTemperature: 1,
	httpTemplates: [],
};

export interface HttpTemplate {
	id: string;
	name: string;
	url: string;
	headers: Record<string, string>;
	method: string;
	bodyTemplate?: string;
}

export default class Cannoli extends Plugin {
	settings: CannoliSettings;
	runningCannolis: { [key: string]: Run } = {};
	openai: OpenAIApi;

	async onload() {
		await this.loadSettings();

		this.createCannoliCommands();

		// Rerun the createCannoliCommands function whenever a file is renamed to be a cannoli file
		this.registerEvent(
			this.app.vault.on("rename", (file: TFile, oldPath: string) => {
				if (file.name.includes(".cno.canvas")) {
					this.createCannoliCommands();
				}
			})
		);

		// Add command for running a cannoli
		this.addCommand({
			id: "current",
			name: "Start/Stop this cannoli",
			checkCallback: (checking: boolean) => {
				const isCanvasOpen = this.app.workspace
					.getActiveFile()
					?.path.endsWith(".canvas");

				if (isCanvasOpen) {
					if (!checking) {
						this.startOrStopCannoli();
					}

					return true;
				}

				return false;
			},
		});

		addIcon("cannoli", cannoliIcon);

		// This creates an icon in the left ribbon.
		this.addRibbonIcon(
			"cannoli",
			"Start/Stop this cannoli",
			this.startOrStopCannoli
		);

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new CannoliSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	createCannoliCommands = async () => {
		// Sleep for 0.5s to give the vault time to load
		await new Promise((resolve) => setTimeout(resolve, 500));

		// Get all files that contain ".cno.canvas" in their name
		const cannoliFiles = this.app.vault.getFiles().filter((file) => {
			return file.name.includes(".cno.canvas");
		});

		// Create a command for each cannoli file
		cannoliFiles.forEach((file) => {
			this.addCommand({
				id: `run-cannoli-${file.path}`,
				name: `Run ${file.basename.slice(0, -4)}`,
				callback: async () => {
					this.startCannoli(file);
				},
			});
		});
	};

	startOrStopCannoli = async () => {
		const activeFile = this.app.workspace.getActiveFile();

		// Check if file is a .canvas file
		if (!activeFile || !activeFile.path.endsWith(".canvas")) {
			new Notice("Move to a canvas file to start a cannoli");
			return;
		}

		// Check if the cannoli is already running
		if (this.runningCannolis[activeFile.basename]) {
			this.runningCannolis[activeFile.basename].stop();
			delete this.runningCannolis[activeFile.basename];
			return;
		}

		this.startCannoli(activeFile);
	};

	startCannoli = async (file: TFile) => {
		// If the api key is the default, send a notice telling the user to add their key
		if (this.settings.openaiAPIKey === DEFAULT_SETTINGS.openaiAPIKey) {
			new Notice(
				"Please enter your OpenAI API key in the Cannoli settings"
			);
			return;
		}

		// Create an instance of OpenAI
		const configuration = new Configuration({
			apiKey: this.settings.openaiAPIKey,
		});
		delete configuration.baseOptions.headers["User-Agent"];

		// Create an instance of OpenAI
		this.openai = new OpenAIApi(configuration);

		// If the file's basename ends with .cno, don't include the extension in the notice
		const name = file.basename.endsWith(".cno")
			? file.basename.slice(0, -4)
			: file.basename;

		// Check if the cannoli is already running
		if (this.runningCannolis[file.basename]) {
			new Notice(`Cannoli: ${name} is already running`);
			return;
		}

		new Notice(`Started cannoli: ${name}`);

		// Sleep for 1.5s to give the vault time to load
		await new Promise((resolve) => setTimeout(resolve, 1500));

		const canvas = new Canvas(file);
		await canvas.fetchData();

		const factory = new CannoliFactory(canvas.getCanvasData());

		const graph = factory.getCannoliData();
		// console.log(JSON.stringify(graph, null, 2));

		console.log(`Starting cannoli: ${name}`);

		const shouldContinue = await this.validateCannoli(
			graph,
			file,
			name,
			canvas
		);

		//const shouldContinue = true;

		if (shouldContinue) {
			await this.runCannoli(graph, file, name, canvas);
		}
	};

	validateCannoli = async (
		graph: VerifiedCannoliCanvasData,
		file: TFile,
		name: string,
		canvas: Canvas
	) => {
		return new Promise<boolean>((resolve) => {
			// Create callback function to trigger notice
			const onFinish = (stoppage: Stoppage) => {
				// console.log("Finished validation run");

				delete this.runningCannolis[file.basename];

				if (stoppage.reason === "error") {
					new Notice(
						`Cannoli ${name} failed with the error:\n\n${stoppage.message}`
					);
					resolve(false);
					return;
				}

				const onContinueCallback = () => {
					resolve(true); // Resolve with true if continued
				};

				const onCancelCallback = () => {
					resolve(false); // Resolve with false if canceled
				};

				// If the total price is greater than the threshold, ask the user if they want to continue
				if (stoppage.totalCost > this.settings.costThreshold) {
					new RunPriceAlertModal(
						this.app,
						stoppage.usage,
						onContinueCallback,
						onCancelCallback
					).open();
				} else {
					// Otherwise, continue
					onContinueCallback();
				}
			};

			const validationGraph = new CannoliGraph(
				JSON.parse(JSON.stringify(graph))
			);

			// Create validation run
			const validationRun = new Run({
				graph: validationGraph.graph,
				isMock: true,
				canvas: canvas,
				vault: this.app.vault,
				onFinish: onFinish,
				httpTemplates: this.settings.httpTemplates,
				cannoli: this,
			});

			// console.log("Starting validation run");

			validationRun.start();
		});
	};

	runCannoli = async (
		graph: VerifiedCannoliCanvasData,
		file: TFile,
		name: string,
		canvas: Canvas
	) => {
		return new Promise<void>((resolve) => {
			// Create callback function to trigger notice
			const onFinish = (stoppage: Stoppage) => {
				delete this.runningCannolis[file.basename];

				let costString = "";

				// If the cost is less than 0.01, don't show the notice
				if (stoppage.totalCost > 0.01) {
					costString = `\n$${stoppage.totalCost.toFixed(2)}`;
				}

				if (stoppage.reason === "error") {
					new Notice(
						`Cannoli ${name} failed with the error:\n\n${stoppage.message}${costString}`
					);
				} else if (stoppage.reason === "complete") {
					new Notice(`Cannoli complete: ${name}${costString}`);
				} else {
					new Notice(`Cannoli stopped: ${name}${costString}`);
				}

				console.log(
					`${name} finished with cost: ${stoppage.totalCost}`
				);

				// Resolve the promise to continue the async function
				resolve();
			};

			const liveGraph = new CannoliGraph(
				JSON.parse(JSON.stringify(graph))
			);

			// Create live run
			const run = new Run({
				graph: liveGraph.graph,
				openai: this.openai,
				openAiConfig: {
					model: this.settings.defaultModel,
					temperature: this.settings.defaultTemperature,
				},
				isMock: false,
				canvas: canvas,
				vault: this.app.vault,
				onFinish: onFinish,
				httpTemplates: this.settings.httpTemplates,
				cannoli: this,
				addFilenameAsHeader: this.settings.addFilenameAsHeader,
			});

			this.runningCannolis[file.basename] = run;

			run.start();
		});
	};

	addSampleFolder = async () => {
		try {
			await this.app.vault.createFolder("Cannoli College");
		} catch (error) {
			// If the folder already exists, send a Notice
			new Notice("Cannoli College folder already exists");
			return;
		}

		// For each element of the cannoliCollege object, create a subfolder with the name of the key
		for (const [key, value] of Object.entries(cannoliCollege)) {
			await this.app.vault.createFolder("Cannoli College/" + key);

			// Iterate through the array of objects in the subfolder
			for (const item of value) {
				const { name, content } = item; // Destructure the name and content properties

				await this.app.vault.create(
					"Cannoli College/" + key + "/" + name,
					content
				);
			}
		}
	};
}

export class RunPriceAlertModal extends Modal {
	usage: Usage[];
	onContinue: () => void;
	onCancel: () => void;

	constructor(
		app: App,
		usage: Record<string, Usage>,
		onContinue: () => void,
		onCancel: () => void
	) {
		super(app);
		this.usage = Object.values(usage);
		this.onContinue = onContinue;
		this.onCancel = onCancel;
	}

	onOpen() {
		const { contentEl } = this;

		let totalCost = 0;

		for (const usageItem of this.usage) {
			totalCost += usageItem.modelUsage.totalCost;
		}

		contentEl.createEl("h1", { text: "Run cost alert" });
		contentEl.createEl("p", {
			text: "Check the cost of your run before continuing",
		});

		// Convert usage object to array

		this.usage.forEach((usage) => {
			contentEl.createEl("h2", { text: `Model: ${usage.model.name}` });
			contentEl
				.createEl("p", {
					text: `\t\tEstimated prompt tokens: ${usage.modelUsage.promptTokens}`,
				})
				.addClass("whitespace");
			contentEl
				.createEl("p", {
					text: `\t\tNumber of API calls: ${usage.modelUsage.apiCalls}`,
				})
				.addClass("whitespace");
			contentEl
				.createEl("p", {
					text: `\t\tCost: $${(
						usage.modelUsage.promptTokens *
						usage.model.promptTokenPrice
					).toFixed(2)}`,
				})
				.addClass("whitespace");
		});

		contentEl.createEl("h2", {
			text: `Total cost: $${totalCost.toFixed(2)}`,
		});

		const panel = new Setting(contentEl);

		panel.addButton((btn) =>
			btn.setButtonText("Cancel").onClick(() => {
				this.close();
				this.onCancel();
			})
		);

		panel.addButton((btn) =>
			btn
				.setButtonText("Continue")
				.setCta()
				.onClick(() => {
					this.close();
					this.onContinue();
				})
		);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

export class HttpTemplateEditorModal extends Modal {
	template: HttpTemplate;
	onSave: (template: HttpTemplate) => void;
	onCancel: () => void;

	constructor(
		app: App,
		template: HttpTemplate,
		onSave: (template: HttpTemplate) => void,
		onCancel: () => void
	) {
		super(app);
		this.template = template;
		this.onSave = onSave;
		this.onCancel = onCancel;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.addClass("http-template-editor");
		contentEl.createEl("h1", { text: "Edit action node template" });

		const createInputGroup = (
			labelText: string,
			inputElement: HTMLElement,
			id: string
		) => {
			const div = contentEl.createEl("div", {
				cls: "http-template-group",
			});
			const label = div.createEl("label", { text: labelText });
			label.htmlFor = id;
			inputElement.setAttribute("id", id);
			div.appendChild(inputElement);
		};

		const createDescription = (text: string) => {
			const p = contentEl.createEl("p", {
				cls: "http-template-description",
			});
			p.textContent = text;
			return p;
		};

		const nameInput = contentEl.createEl("input", {
			type: "text",
			value: this.template.name || "",
		}) as HTMLInputElement;
		nameInput.setAttribute("id", "name-input");
		createInputGroup("Name:", nameInput, "name-input");

		const urlInput = contentEl.createEl("input", {
			type: "text",
			value: this.template.url || "",
		}) as HTMLInputElement;
		urlInput.setAttribute("id", "url-input");
		createInputGroup("URL:", urlInput, "url-input");

		// Create a select element for HTTP methods
		const methodSelect = contentEl.createEl("select") as HTMLSelectElement;
		const methods = ["GET", "POST", "PUT", "DELETE"];
		methods.forEach((method) => {
			const option = methodSelect.createEl("option", {
				text: method,
				value: method,
			});
			// If the current template's method matches, select this option
			if (this.template.method === method) {
				option.selected = true;
			}
		});
		createInputGroup("Method:", methodSelect, "method-select");

		const headersValue =
			this.template.headers &&
			Object.keys(this.template.headers).length > 0
				? JSON.stringify(this.template.headers, null, 2)
				: JSON.stringify(
						{ "Content-Type": "application/json" },
						null,
						2
						// eslint-disable-next-line no-mixed-spaces-and-tabs
				  );

		const headersInput = contentEl.createEl("textarea", {
			placeholder: `{ "Content-Type": "application/json" }`,
		}) as HTMLTextAreaElement;
		headersInput.value = headersValue;
		headersInput.setAttribute("rows", "3");

		createInputGroup("Headers:", headersInput, "headers-input");

		// Body template input
		const bodyTemplateInput = contentEl.createEl("textarea", {
			placeholder:
				"Enter body template. Use {{variableName}} for variables.",
		}) as HTMLTextAreaElement;
		const formattedBody = this.formatBody(this.template.bodyTemplate || "");
		bodyTemplateInput.value = formattedBody;
		bodyTemplateInput.setAttribute("rows", "3");
		bodyTemplateInput.setAttribute(
			"placeholder",
			"Enter body template. Use {{variableName}} for variables."
		);
		createInputGroup(
			"Body template: (optional)",
			bodyTemplateInput,
			"body-template-input"
		);

		// Add the permanent description below the input
		createDescription(
			"You can use the optional body template to predefine the structure of the request body. Use {{variableName}} syntax to insert variables into the body template. If there's only one variable, it will be replaced with whatever is written to the action node. If there are multiple variables, the action node will look for the variables in the available named arrows."
		);

		const panel = new Setting(contentEl);

		panel.addButton((btn) =>
			btn.setButtonText("Cancel").onClick(() => {
				this.close();
				this.onCancel();
			})
		);

		panel.addButton((btn) =>
			btn
				.setButtonText("Save")
				.setCta()
				.onClick(() => {
					// Parsing headers
					let headers: Record<string, string> = {};
					try {
						headers = JSON.parse(headersInput.value || "{}");
					} catch (error) {
						alert(
							"Invalid JSON format for headers. Please correct and try again."
						);
						return;
					}

					// Updating template object
					this.template.name = nameInput.value;
					this.template.url = urlInput.value;
					this.template.headers = headers;
					this.template.method = methodSelect.value;
					this.template.bodyTemplate = bodyTemplateInput.value;

					this.close();
					this.onSave(this.template);
				})
		);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	formatBody(body: string): string {
		try {
			// Try to parse the body as JSON
			const parsedBody = JSON.parse(body);

			// If successful, stringify it with proper formatting
			return JSON.stringify(parsedBody, null, 2);
		} catch (error) {
			// If parsing failed, return the body as-is
			return body;
		}
	}
}

class CannoliSettingTab extends PluginSettingTab {
	plugin: Cannoli;

	constructor(app: App, plugin: Cannoli) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		// Add button to add sample folder
		new Setting(containerEl)
			.setName("Add Cannoli College")
			.setDesc(
				"Add a folder of sample cannolis to your vault to walk you through the basics of Cannoli."
			)
			.addButton((button) =>
				button.setButtonText("Add").onClick(() => {
					this.plugin.addSampleFolder();
				})
			);

		new Setting(containerEl)
			.setName("OpenAI API key")
			.setDesc(
				"This key will be used to make all openai LLM calls. Be aware that complex cannolis, especially those with many GPT-4 calls, can be expensive to run."
			)
			.addText((text) =>
				text
					.setValue(this.plugin.settings.openaiAPIKey)
					.onChange(async (value) => {
						this.plugin.settings.openaiAPIKey = value;
						await this.plugin.saveSettings();
					})
			);

		// Cost threshold setting. This is the cost at which the user will be alerted before running a Cannoli
		new Setting(containerEl)
			.setName("Cost threshold")
			.setDesc(
				"If the cannoli you are about to run is estimated to cost more than this amount (USD$), you will be alerted before running it."
			)
			.addText((text) =>
				text
					.setValue(this.plugin.settings.costThreshold.toString())
					.onChange(async (value) => {
						this.plugin.settings.costThreshold = parseFloat(value);
						await this.plugin.saveSettings();
					})
			);

		// Default LLM model setting
		new Setting(containerEl)
			.setName("Default LLM model")
			.setDesc(
				"This model will be used for all LLM nodes unless overridden with a config arrow. (Note that special arrow types rely on function calling, which is not available in all models.)"
			)
			.addText((text) =>
				text
					.setValue(this.plugin.settings.defaultModel)
					.onChange(async (value) => {
						this.plugin.settings.defaultModel = value;
						await this.plugin.saveSettings();
					})
			);

		// Default LLM temperature setting
		new Setting(containerEl)
			.setName("Default LLM temperature")
			.setDesc(
				"This temperature will be used for all LLM nodes unless overridden with a config arrow."
			)
			.addText((text) =>
				text
					.setValue(
						this.plugin.settings.defaultTemperature.toString()
					)
					.onChange(async (value) => {
						this.plugin.settings.defaultTemperature =
							parseFloat(value);
						await this.plugin.saveSettings();
					})
			);

		// Toggle adding filenames as headers when extracting text from files
		new Setting(containerEl)
			.setName("Add filenames as headers to extracted notes")
			.setDesc(
				"When extracting a note in a node, add the filename as a header."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.addFilenameAsHeader || false)
					.onChange(async (value) => {
						this.plugin.settings.addFilenameAsHeader = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Action node templates")
			.setDesc("Manage default HTTP templates for action nodes.")
			.addButton((button) =>
				button.setButtonText("+ Template").onClick(() => {
					// Create a new command object to pass to the modal
					const newCommand: HttpTemplate = {
						name: "",
						url: "",
						headers: {},
						id: "",
						method: "GET",
					};

					// Open the modal to edit the new template
					new HttpTemplateEditorModal(
						this.app,
						newCommand,
						(command) => {
							this.plugin.settings.httpTemplates.push(command);
							this.plugin.saveSettings();
							// Refresh the settings pane to reflect the changes
							this.display();
						},
						() => {}
					).open();
				})
			);

		// Iterate through saved templates and display them
		for (const template of this.plugin.settings.httpTemplates) {
			new Setting(containerEl)
				.setName(template.name)
				.addButton((button) =>
					button.setButtonText("Edit").onClick(() => {
						// Open the modal to edit the existing template
						new HttpTemplateEditorModal(
							this.app,
							template,
							(updatedTemplate) => {
								Object.assign(template, updatedTemplate);
								this.plugin.saveSettings();
								// Refresh the settings pane to reflect the changes
								this.display();
							},
							() => {}
						).open();
					})
				)
				.addButton((button) =>
					button.setButtonText("Delete").onClick(() => {
						const index =
							this.plugin.settings.httpTemplates.indexOf(
								template
							);
						if (index > -1) {
							this.plugin.settings.httpTemplates.splice(index, 1);
							this.plugin.saveSettings();
							// Refresh the settings pane to reflect the changes
							this.display();
						}
					})
				);
		}
	}
}
