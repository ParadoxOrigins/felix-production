'use strict';

const FunCommands = require('../../structures/CommandCategories/MiscCommands');

class IamNot extends FunCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'iamnot',
                description: 'Remove a self-assignable role from yourself, you can see the list of self-assignable roles set on this server with `{prefix}iamnot',
                usage: '{prefix}iamnot <role_name>',
            },
            conf: {
                requirePerms: ["manageRoles"],
                guildOnly: true
            }
        });
    }

    // eslint-disable-next-line no-unused-vars 
    async run(client, message, args, guildEntry, userEntry) {
        guildEntry.selfAssignableRoles = guildEntry.selfAssignableRoles.filter(r => message.channel.guild.roles.has(r.id)); //Filter deleted roles
        if (!args[0]) {
            return this.createList(client, message, guildEntry);
        } else {
            return this.removeRole(client, message, args, guildEntry);
        }
    }

    createList(client, message, guildEntry) {
        if (!guildEntry.selfAssignableRoles[0]) {
            return message.channel.createMessage(":x: There is no self-assignable role set on this server");
        }
        return client.interactiveList.createPaginatedMessage({
            channel: message.channel,
            userID: message.author.id,
            messages: (() => {
                let messages = [];
                for (const role of guildEntry.selfAssignableRoles) {
                    const guildRole = message.channel.guild.roles.get(role.id);
                    messages.push({
                        embed: {
                            title: "Self-assignable roles list",
                            description: "Here's the list of the self-assignable roles, you can assign one to yourself with `" + guildEntry.getPrefix + "iam <role_name>`\n",
                            footer: {
                                text: `Showing page {index}/${guildEntry.selfAssignableRoles.length} | Time limit: 60 seconds`
                            },
                            fields: [{
                                name: 'Name',
                                value: `${guildRole.name}`,
                                inline: true
                            }, {
                                name: 'HEX Color',
                                value: `#${this.getHexColor(guildRole.color)} (the borders color of this list are a preview)`,
                                inline: true
                            }, {
                                name: `Hoisted`,
                                value: guildRole.hoist ? `:white_check_mark:` : `:x:`
                            }, {
                                name: 'Mentionable',
                                value: guildRole.mentionable ? `:white_check_mark:` : `:x:`,
                                inline: true
                            }, {
                                name: 'Incompatible roles',
                                value: role.incompatibleRoles[0] ? 'This role cannot be stacked with: ' + client.commands.get('uinfo').sliceRoles(role.incompatibleRoles.filter(r => message.channel.guild.roles.has(r)).map(r => `<@&${r}>`)) : 'This role can be stacked with all other roles'
                            }],
                            color: guildRole.color
                        }
                    });
                }
                return messages;
            })()
        });
    }

    async removeRole(client, message, args, guildEntry) {
        let guildRole = await this.getRoleFromText({
            message: message,
            client: client,
            text: args.join(' ')
        });
        const member = message.channel.guild.members.get(message.author.id);
        if (!guildRole || !guildEntry.selfAssignableRoles.find(r => r.id === guildRole.id)) {
            return message.channel.createMessage(":x: The specified role does not exist or it is not a self-assignable role");
        }
        if (!member.roles.includes(guildRole.id)) {
            return message.channel.createMessage(':x: You do not have this role, therefore I can\'t remove it');
        }
        if (this.getHighestRole(client.bot.user.id, message.channel.guild) && (guildRole.position > this.getHighestRole(client.bot.user.id, message.channel.guild).position)) {
            return message.channel.createMessage(`:x: The role \`${guildRole.name}\` is higher than my highest role, therefore, I can't give/remove it from you :c`);
        }
        await member.removeRole(guildRole.id);
        return message.channel.createMessage(":white_check_mark: Alright, I removed from you the role `" + guildRole.name + "`");
    }
}

module.exports = new IamNot();