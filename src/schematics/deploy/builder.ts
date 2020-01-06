import {
  BuilderContext,
  BuilderOutput,
  createBuilder,
  targetFromTargetString
} from "@angular-devkit/architect";
import { NodeJsSyncHost } from "@angular-devkit/core/node";
import deploy from "./actions";
import { experimental, join, normalize } from "@angular-devkit/core";
import { DeployBuilderOptions } from '../interfaces';
import { getFirebaseProjectName } from "../utils";

// Call the createBuilder() function to create a builder. This mirrors
// createJobHandler() but add typings specific to Architect Builders.
export default createBuilder<any>(
  async (options: DeployBuilderOptions, context: BuilderContext): Promise<BuilderOutput> => {
    // The project root is added to a BuilderContext.
    const root = normalize(context.workspaceRoot);
    const workspace = new experimental.workspace.Workspace(
      root,
      new NodeJsSyncHost()
    );
    await workspace
      .loadWorkspaceFromHost(normalize("angular.json"))
      .toPromise();

    if (!context.target) {
      throw new Error("Cannot deploy the application without a target");
    }

    const project = workspace.getProject(context.target.project);

    const firebaseProject = getFirebaseProjectName(
      workspace.root,
      context.target.project
    );

    try {
      await deploy(
        require("firebase-tools"),
        context,
        join(workspace.root, project.root),
        firebaseProject,
        options.buildTarget ? targetFromTargetString(options.buildTarget) : undefined,
      );
    } catch (e) {
      console.error("Error when trying to deploy: ");
      console.error(e.message);
      return { success: false };
    }

    return { success: true };
  }
);
