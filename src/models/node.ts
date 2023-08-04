import { AllCanvasNodeData } from "obsidian/canvas";
import {
	CannoliObject,
	CannoliObjectKind,
	CannoliObjectStatus,
	CannoliVertex,
	EdgeType,
	GroupType,
	IndicatedEdgeType,
	IndicatedGroupType,
	IndicatedNodeType,
	NodeType,
	Reference,
} from "./object";
import { Run } from "src/run";
import { Vault } from "obsidian";
import { ChatEdge, SingleVariableEdge } from "./edge";

export class CannoliNode extends CannoliVertex {
	NodePrefixMap: Record<string, IndicatedNodeType> = {
		$: IndicatedNodeType.Call,
	};

	NodeColorMap: Record<string, IndicatedNodeType> = {
		"0": IndicatedNodeType.Call,
		"1": IndicatedNodeType.Call,
		"3": IndicatedNodeType.Call,
		"4": IndicatedNodeType.Call,
		"6": IndicatedNodeType.Content,
	};

	constructor(
		id: string,
		text: string,
		graph: Record<string, CannoliObject>,
		isClone: boolean,
		vault: Vault,
		canvasData: AllCanvasNodeData,
		outgoingEdges?: { id: string; isReflexive: boolean }[],
		incomingEdges?: { id: string; isReflexive: boolean }[],
		groups?: string[]
	) {
		super(
			id,
			text,
			graph,
			isClone,
			vault,
			canvasData,
			outgoingEdges,
			incomingEdges,
			groups
		);
		incomingEdges = incomingEdges || [];
		outgoingEdges = outgoingEdges || [];
		groups = groups || [];

		this.kind = CannoliObjectKind.Node;
	}

	buildRenderFunction(): (
		variables: {
			name: string;
			content: string;
		}[]
	) => Promise<string> {
		console.error(`Need to implement buildRenderFunction`);
		return async () => {
			return "Implement render function";
		};
	}

	dependencyCompleted(dependency: CannoliObject, run: Run): void {
		if (this.allDependenciesComplete()) {
			this.execute(run);
		}
	}

	getIndicatedType():
		| IndicatedEdgeType
		| IndicatedNodeType
		| IndicatedGroupType {
		// If the node has no incoming or outgoing edges
		if (
			this.incomingEdges.length === 0 &&
			this.outgoingEdges.length === 0
		) {
			// Check the first line of its text
			const firstLine = this.text.split("\n")[0].trim();
			// If it starts with [ and ends with ], it's a floating node
			if (firstLine.startsWith("[") && firstLine.endsWith("]")) {
				return IndicatedNodeType.Floating;
			} else {
				return IndicatedNodeType.NonLogic;
			}
		}

		// Check if the first line is a single character, and if it's in the prefix map
		const firstLine = this.text.split("\n")[0];
		if (firstLine.length === 1 && firstLine in this.NodePrefixMap) {
			return this.NodePrefixMap[firstLine];
		}

		// If not, check the color map
		const color = this.canvasData.color;
		if (color) {
			if (color in this.NodeColorMap) {
				return this.NodeColorMap[color];
			} else {
				return IndicatedNodeType.NonLogic;
			}
		} else {
			return IndicatedNodeType.Call;
		}
	}

	decideType(): EdgeType | NodeType | GroupType {
		switch (this.getIndicatedType()) {
			case IndicatedNodeType.Call:
				return this.decideCallType();
			case IndicatedNodeType.Content:
				return this.decideContentType();
			case IndicatedNodeType.Floating:
				return NodeType.Floating;
			case IndicatedNodeType.NonLogic:
				return NodeType.NonLogic;

			default:
				throw new Error(
					`Error on node ${this.id}: could not decide type.`
				);
		}
	}

	decideCallType(): NodeType {
		// If there are any outgoing choice edges
		if (
			this.outgoingEdges.some(
				(edge) =>
					this.graph[edge.id].getIndicatedType() ===
					IndicatedEdgeType.Choice
			)
		) {
			// Return choice
			return NodeType.Choice;
		}
		// If there are any outgoing list edges, it's a list node
		else if (
			this.outgoingEdges.some(
				(edge) =>
					this.graph[edge.id].getIndicatedType() ===
					IndicatedEdgeType.List
			)
		) {
			return NodeType.List;
		} else {
			return NodeType.StandardCall;
		}
	}

	decideContentType(): NodeType {
		// If the text starts and ends with `, it's a formatter (check that it isn't a code block)
		const formatPattern = /^`[^`].*[^`]`$/;
		const codeBlockPattern = /^```[\s\S]*```$/;

		if (
			formatPattern.test(this.text.trim()) &&
			!codeBlockPattern.test(this.text.trim())
		) {
			return NodeType.Formatter;
		}

		// If the result of getReference is not null, it's a reference node
		if (this.getReference() !== null) {
			return NodeType.Reference;
		}

		// If there are any incoming vault edges, it's a vault node
		if (
			this.incomingEdges.some(
				(edge) =>
					this.graph[edge.id].getIndicatedType() ===
					IndicatedEdgeType.Vault
			)
		) {
			return NodeType.Vault;
		}

		// If there are no incoming edges, it's an input node
		if (this.incomingEdges.length === 0) {
			return NodeType.Input;
		}

		return NodeType.Display;
	}

	getReference(): Reference | null {
		const pagePattern = /^>\[\[([^\]]+)\]\]$/;
		const floatingPattern = /^>\[([^\]]+)\]$/;

		const strippedText = this.text.trim();

		let match = strippedText.match(pagePattern);
		if (match) {
			return { name: match[1], type: "page" };
		}

		match = strippedText.match(floatingPattern);
		if (match) {
			return { name: match[1], type: "floating" };
		}

		return null;
	}

	createTyped(graph: Record<string, CannoliObject>): CannoliObject | null {
		switch (this.decideType()) {
			case NodeType.StandardCall:
				return new CallNode(
					this.id,
					this.text,
					graph,
					false,
					this.vault,
					this.canvasData,
					this.outgoingEdges,
					this.incomingEdges,
					this.groups
				);
			case NodeType.List:
				return new ListNode(
					this.id,
					this.text,
					graph,
					false,
					this.vault,
					this.canvasData,
					this.outgoingEdges,
					this.incomingEdges,
					this.groups
				);

			case NodeType.Choice:
				return new ChoiceNode(
					this.id,
					this.text,
					graph,
					false,
					this.vault,
					this.canvasData,
					this.outgoingEdges,
					this.incomingEdges,
					this.groups
				);
			case NodeType.Display:
				return new DisplayNode(
					this.id,
					this.text,
					graph,
					false,
					this.vault,
					this.canvasData,
					this.outgoingEdges,
					this.incomingEdges,
					this.groups
				);
			case NodeType.Input:
				return new InputNode(
					this.id,
					this.text,
					graph,
					false,
					this.vault,
					this.canvasData,
					this.outgoingEdges,
					this.incomingEdges,
					this.groups
				);
			case NodeType.Formatter:
				return new FormatterNode(
					this.id,
					this.text,
					graph,
					false,
					this.vault,
					this.canvasData,
					this.outgoingEdges,
					this.incomingEdges,
					this.groups
				);
			case NodeType.Reference:
				return new ReferenceNode(
					this.id,
					this.text,
					graph,
					false,
					this.vault,
					this.canvasData,
					this.outgoingEdges,
					this.incomingEdges,
					this.groups
				);
			case NodeType.Vault:
				return new VaultNode(
					this.id,
					this.text,
					graph,
					false,
					this.vault,
					this.canvasData,
					this.outgoingEdges,
					this.incomingEdges,
					this.groups
				);
			case NodeType.Floating:
				return new FloatingNode(
					this.id,
					this.text,
					graph,
					false,
					this.vault,
					this.canvasData
				);
			case NodeType.NonLogic:
				return null;

			default:
				throw new Error(
					`Error on node ${this.id}: could not create typed node.`
				);
		}
	}

	logDetails(): string {
		let groupsString = "";
		groupsString += `Groups: `;
		for (const group of this.groups) {
			groupsString += `\n\t-"${this.ensureStringLength(
				this.graph[group].text,
				15
			)}"`;
		}

		let incomingEdgesString = "";
		incomingEdgesString += `Incoming Edges: `;
		for (const edge of this.incomingEdges) {
			incomingEdgesString += `\n\t-"${this.ensureStringLength(
				this.graph[edge.id].text,
				15
			)}"`;
		}

		let outgoingEdgesString = "";
		outgoingEdgesString += `Outgoing Edges: `;
		for (const edge of this.outgoingEdges) {
			outgoingEdgesString += `\n\t-"${this.ensureStringLength(
				this.graph[edge.id].text,
				15
			)}"`;
		}

		return (
			super.logDetails() +
			`[] Node ${this.id} Text: "${this.text}"\n${incomingEdgesString}\n${outgoingEdgesString}\n${groupsString}\n`
		);
	}
}

export class CallNode extends CannoliNode {
	renderFunction: (
		variables: { name: string; content: string }[]
	) => Promise<string>;

	constructor(
		id: string,
		text: string,
		graph: Record<string, CannoliObject>,
		isClone: boolean,
		vault: Vault,
		canvasData: AllCanvasNodeData,
		outgoingEdges?: { id: string; isReflexive: boolean }[],
		incomingEdges?: { id: string; isReflexive: boolean }[],
		groups?: string[]
	) {
		super(
			id,
			text,
			graph,
			isClone,
			vault,
			canvasData,
			outgoingEdges,
			incomingEdges,
			groups
		);

		this.renderFunction = this.buildRenderFunction();
	}

	async run() {
		console.log(`Running call node with text "${this.text}"`);

		// TEST VERSION (sleep for random time between 0 and 3 seconds)
		const sleepTime = Math.random() * 3000;
		await new Promise((resolve) => setTimeout(resolve, sleepTime));

		// Load all outgoing edges
		for (const edge of this.outgoingEdges) {
			const edgeObject = this.graph[edge.id];
			if (edgeObject instanceof SingleVariableEdge) {
				edgeObject.load({
					content: "testing",
				});
			} else if (edgeObject instanceof ChatEdge) {
				edgeObject.load({
					messages: [
						{
							role: "user",
							content: "testing",
						},
					],
				});
			}
		}

		console.log(`Finished running call node with text "${this.text}"`);
	}

	async mockRun() {
		// Load all outgoing edges
		for (const edge of this.outgoingEdges) {
			const edgeObject = this.graph[edge.id];
			if (edgeObject instanceof SingleVariableEdge) {
				edgeObject.load({
					content: "testing",
				});
			} else if (edgeObject instanceof ChatEdge) {
				edgeObject.load({
					messages: [
						{
							role: "user",
							content: "testing",
						},
					],
				});
			}
		}
	}

	logDetails(): string {
		return super.logDetails() + `Type: Call\n`;
	}
}

export class ListNode extends CannoliNode {
	logDetails(): string {
		return super.logDetails() + `Subtype: List\n`;
	}
}

export class ChoiceNode extends CannoliNode {
	logDetails(): string {
		return super.logDetails() + `Subtype: Choice\n`;
	}
}

export class ContentNode extends CannoliNode {
	constructor(
		id: string,
		text: string,
		graph: Record<string, CannoliObject>,
		isClone: boolean,
		vault: Vault,
		canvasData: AllCanvasNodeData,
		outgoingEdges: { id: string; isReflexive: boolean }[],
		incomingEdges: { id: string; isReflexive: boolean }[],
		groups: string[]
	) {
		super(
			id,
			text,
			graph,
			isClone,
			vault,
			canvasData,
			outgoingEdges,
			incomingEdges,
			groups
		);
	}

	async run() {
		// TEST VERSION (write a random string to the text field)
		console.log(`Running content node with text "${this.text}"`);
		this.text = Math.random().toString(36).substring(7);
	}

	async mockRun() {
		console.log(`Mock running content node with text "${this.text}"`);
	}

	logDetails(): string {
		return super.logDetails() + `Type: Content\n`;
	}
}

export class VaultNode extends CannoliNode {
	constructor(
		id: string,
		text: string,
		graph: Record<string, CannoliObject>,
		isClone: boolean,
		vault: Vault,
		canvasData: AllCanvasNodeData,
		outgoingEdges: { id: string; isReflexive: boolean }[],
		incomingEdges: { id: string; isReflexive: boolean }[],
		groups: string[]
	) {
		super(
			id,
			text,
			graph,
			isClone,
			vault,
			canvasData,
			outgoingEdges,
			incomingEdges,
			groups
		);
	}

	logDetails(): string {
		return super.logDetails() + `Subtype: Vault\n`;
	}
}

export class ReferenceNode extends CannoliNode {
	reference: Reference;

	constructor(
		id: string,
		text: string,
		graph: Record<string, CannoliObject>,
		isClone: boolean,
		vault: Vault,
		canvasData: AllCanvasNodeData,
		outgoingEdges: { id: string; isReflexive: boolean }[],
		incomingEdges: { id: string; isReflexive: boolean }[],
		groups: string[]
	) {
		super(
			id,
			text,
			graph,
			isClone,
			vault,
			canvasData,
			outgoingEdges,
			incomingEdges,
			groups
		);

		const reference = this.getReference();

		if (reference === null) {
			throw new Error(
				`Error on reference node ${this.id}: could not find reference.`
			);
		} else {
			this.reference = reference;
		}
	}

	async getContent(): Promise<string> {
		if (this.reference.type === "page") {
			const file = this.vault
				.getFiles()
				.find((file) => file.basename === this.reference.name);
			if (file) {
				return await this.vault.read(file);
			} else {
				return `Could not find file ${this.reference.name}`;
			}
		} else {
			// Search through all nodes for a floating node with the correct name
			for (const objectId in this.graph) {
				const object = this.graph[objectId];
				if (
					object instanceof FloatingNode &&
					object.getName() === this.reference.name
				) {
					return object.getContent();
				}
			}
		}

		return `Could not find reference ${this.reference.name}`;
	}

	editContent(newContent: string, run: Run): void {
		if (this.reference.type === "page") {
			const file = this.vault
				.getFiles()
				.find((file) => file.basename === this.reference.name);
			if (file) {
				this.vault.modify(file, newContent);
			} else {
				throw new Error(
					`Error on reference node ${this.id}: could not find file.`
				);
			}
		} else {
			// Search through all nodes for a floating node with the correct name
			for (const objectId in this.graph) {
				const object = this.graph[objectId];
				if (
					object instanceof FloatingNode &&
					object.getName() === this.reference.name
				) {
					object.editContent(newContent, run);
					return;
				}
			}
		}
	}

	logDetails(): string {
		return (
			super.logDetails() +
			`Subtype: Reference\nReference name: ${this.reference.name}\n`
		);
	}
}

export class FormatterNode extends CannoliNode {
	logDetails(): string {
		return super.logDetails() + `Subtype: Formatter\n`;
	}
}

export class InputNode extends CannoliNode {
	logDetails(): string {
		return super.logDetails() + `Subtype: Input\n`;
	}
}

export class DisplayNode extends CannoliNode {
	logDetails(): string {
		return super.logDetails() + `Subtype: Display\n`;
	}
}

export class FloatingNode extends CannoliNode {
	constructor(
		id: string,
		text: string,
		graph: Record<string, CannoliObject>,
		isClone: boolean,
		vault: Vault,
		canvasData: AllCanvasNodeData
	) {
		super(id, text, graph, isClone, vault, canvasData);
		this.status = CannoliObjectStatus.Complete;
	}

	dependencyCompleted(dependency: CannoliObject, run: Run): void {
		return;
	}

	dependencyRejected(dependency: CannoliObject, run: Run): void {
		return;
	}

	async execute(run: Run) {
		return;
	}

	async run() {
		// We should never run a floating node, it shouldn't have any dependencies
		throw new Error(
			`Error on floating node ${this.id}: run is not implemented.`
		);
	}

	async mockRun() {
		// We should never run a floating node, it shouldn't have any dependencies
		throw new Error(
			`Error on floating node ${this.id}: mockRun is not implemented.`
		);
	}

	getName(): string {
		const firstLine = this.text.split("\n")[0].trim();
		// Take the first and last characters off the first line
		return firstLine.substring(1, firstLine.length - 1);
	}

	// Content is everything after the first line
	getContent(): string {
		const firstLine = this.text.split("\n")[0];
		return this.text.substring(firstLine.length + 1);
	}

	editContent(newContent: string, run: Run): void {
		const firstLine = this.text.split("\n")[0];
		this.text = `${firstLine}\n${newContent}`;

		// Emit an update event
		this.emit("update", this, this.status, run);
	}

	logDetails(): string {
		return (
			super.logDetails() +
			`Type: Floating\nName: ${this.getName()}\nContent: ${this.getContent()}\n`
		);
	}
}