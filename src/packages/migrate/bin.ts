#!/usr/bin/env ts-node

process.on('uncaughtException', e => {
  console.log(e)
})
process.on('unhandledRejection', (e, promise) => {
  console.log(String(e), String(promise))
})

process.env.NODE_NO_WARNINGS = '1'

/**
 * Dependencies
 */
import { HelpError, isError } from '@prisma/sdk'
import { LiftCommand } from './cli/commands/LiftCommand'
import { LiftDown } from './cli/commands/LiftDown'
import { LiftSave } from './cli/commands/LiftSave'
import { LiftTmpPrepare } from './cli/commands/LiftTmpPrepare'
import { LiftUp } from './cli/commands/LiftUp'
import { StudioCommand } from './cli/commands/StudioCommand'
import { handlePanic } from './utils/handlePanic'
import { ProviderAliases } from '@prisma/sdk'
import path from 'path'

const providerAliases: ProviderAliases = {
  'prisma-client-js': {
    generatorPath: require.resolve('@prisma/client/generator-build'),
    outputPath: path.dirname(require.resolve('@prisma/client/package.json')),
  },
}

// const access = fs.createWriteStream('out.log')
// process.stdout.write = process.stderr.write = access.write.bind(access)

/**
 * Main function
 */
async function main(): Promise<number> {
  // create a new CLI with our subcommands
  const cli = LiftCommand.new({
    save: LiftSave.new(),
    up: LiftUp.new(),
    down: LiftDown.new(),
    ['tmp-prepare']: LiftTmpPrepare.new(),
    studio: StudioCommand.new(providerAliases),
  })
  // parse the arguments
  const result = await cli.parse(process.argv.slice(2))
  if (result instanceof HelpError) {
    console.error(result)
    return 1
  } else if (isError(result)) {
    console.error(result)
    return 1
  }
  console.log(result)

  return 0
}
process.on('SIGINT', () => {
  process.exit(1) // now the "exit" event will fire
})

/**
 * Run our program
 */
main()
  .then(code => {
    if (code !== 0) {
      process.exit(code)
    }
  })
  .catch(err => {
    if (err.rustStack) {
      // console.error(err.rustStack)
      // console.error(err.stack)
      handlePanic(err, 'TEST', 'TEST').catch(console.error)
    } else {
      console.error(err)
      process.exit(1)
    }
  })
