import { arg, Command, Dictionary, format, HelpError, isError } from '@prisma/sdk'
import chalk from 'chalk'
import open from 'open'

import { Studio } from '../../Studio'
import { ProviderAliases } from '@prisma/sdk'
import { ExperimentalFlagError } from '../../utils/experimental'

export class StudioCommand implements Command {
  public static new(providerAliases: ProviderAliases): StudioCommand {
    return new StudioCommand(providerAliases)
  }

  private static help = format(`
    Browse your data with Studio

    ${chalk.bold.yellow('WARNING')} ${chalk.bold(
    "Prisma's studio functionality is currently in an experimental state.",
  )}
    ${chalk.dim('When using any of the commands below you need to explicitly opt-in via the --experimental flag.')}

    ${chalk.bold('Usage')}

      ${chalk.dim('$')} prisma studio --experimental

    ${chalk.bold('Options')}

      -h, --help     Displays this help message
      -p, --port     Port to start Studio on

    ${chalk.bold('Examples')}

      Start Studio on the default port
      ${chalk.dim('$')} prisma studio --experimental

      Start Studio on a custom port
      ${chalk.dim('$')} prisma studio --port 5555 --experimental
  `)

  private constructor(private readonly providerAliases: ProviderAliases) {
    this.providerAliases = providerAliases
  }

  /**
   * Parses arguments passed to this command
   *
   * @param argv Array of all arguments
   */
  public async parse(argv: string[]): Promise<string | Error> {
    const args = arg(argv, {
      '--help': Boolean,
      '-h': '--help',
      '--port': Number,
      '-p': '--port',
      '--experimental': Boolean,
      '--schema': String,
    })

    if (isError(args)) {
      return this.help(args.message)
    }

    if (args['--help']) {
      return this.help()
    }

    if (!args['--experimental']) {
      throw new ExperimentalFlagError()
    }

    const port = args['--port'] || 5555

    const studio = new Studio({
      schemaPath: args['--schema'],
      port,
    })

    const msg = await studio.start(this.providerAliases)

    await open(`http://localhost:${port}`)

    return msg
  }

  // help message
  public help(error?: string): string | HelpError {
    if (error) {
      return new HelpError(`\n${chalk.bold.red(`!`)} ${error}\n${StudioCommand.help}`)
    }

    return StudioCommand.help
  }
}
